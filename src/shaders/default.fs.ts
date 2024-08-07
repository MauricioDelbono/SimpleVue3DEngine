export default `#version 300 es
precision highp float;

struct Material {
    vec3 color;
    sampler2D diffuse;
    sampler2D specular;
    sampler2D emission;
    float shininess;
};

struct PointLight {    
    bool enabled;
    vec3 position;
    
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

struct SpotLight {    
    bool enabled;
    vec3 position;
    vec3 direction;
    
    float cutOff;
    float outerCutOff;  

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

struct DirLight {
    bool enabled;
    vec3 direction;
  
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

out vec4 FragColor;

in vec3 Normal;
in vec3 FragPos;
in vec2 TexCoords;
in vec4 FragPosLightSpace;

#define NR_POINT_LIGHTS 4

uniform vec3 viewPos;
uniform Material material;
uniform DirLight dirLight;
uniform SpotLight spotLight;
uniform PointLight pointLights[NR_POINT_LIGHTS];
uniform sampler2D shadowMap;

// uniform vec4 uFogColor;
// uniform float uFogNear;
// uniform float uFogFar;

// function prototypes
float ShadowCalculation(vec4 fragPosLightSpace, vec3 normal, vec3 lightDir);
vec3 CalcDirLight(DirLight light, vec3 normal, vec3 viewDir);
vec3 CalcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 viewDir);
vec3 CalcSpotLight(SpotLight light, vec3 normal, vec3 fragPos, vec3 viewDir);

void main()
{
    // float fogAmount = smoothstep(uFogNear, uFogFar, gl_FragCoord.z);
    // outColor = mix(outColor, uFogColor, fogAmount);

    // properties
    vec3 norm = normalize(Normal);
    vec3 viewDir = normalize(viewPos - FragPos);
    vec3 result = vec3(0.0);

    // phase 1: Directional lighting
    if (dirLight.enabled)
        result += CalcDirLight(dirLight, norm, viewDir);

    // phase 2: Point lights
    for(int i = 0; i < NR_POINT_LIGHTS; i++) {
        if (pointLights[i].enabled)
            result += CalcPointLight(pointLights[i], norm, FragPos, viewDir);    
    }
    
    // phase 3: Spot light
    if (spotLight.enabled)
        result += CalcSpotLight(spotLight, norm, FragPos, viewDir);
    
    // emission
    vec3 emission = texture(material.emission, TexCoords).rgb;
    
    FragColor = vec4(result + emission, 1.0);
    
    // apply gamma correction
    float gamma = 2.2;
    FragColor.rgb = pow(FragColor.rgb, vec3(1.0/gamma));
}

vec3 CalcDirLight(DirLight light, vec3 normal, vec3 viewDir)
{
    vec3 lightDir = normalize(-light.direction);
    
    // diffuse shading
    float diff = max(dot(normal, lightDir), 0.0);
    
    // specular shading
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfwayDir), 0.0), material.shininess);
    
    // combine results
    vec3 ambient = light.ambient * (texture(material.diffuse, TexCoords).rgb + material.color);
    vec3 diffuse = light.diffuse * diff * (texture(material.diffuse, TexCoords).rgb + material.color);
    vec3 specular = light.specular * spec * texture(material.specular, TexCoords).rgb;
    
    // calculate shadow
    float shadow = ShadowCalculation(FragPosLightSpace, normal, lightDir);
    return ambient + (1.0 - shadow) * (diffuse + specular);
}

vec3 CalcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 viewDir)
{
    vec3 lightDir = normalize(light.position - fragPos);
    
    // diffuse shading
    float diff = max(dot(normal, lightDir), 0.0);
    
    // specular shading
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfwayDir), 0.0), material.shininess);
    
    // attenuation
    float distance = length(light.position - fragPos);
    float attenuation = 1.0 / distance;
    
    // combine results
    vec3 ambient = light.ambient * (texture(material.diffuse, TexCoords).rgb + material.color);
    vec3 diffuse = light.diffuse * diff * (texture(material.diffuse, TexCoords).rgb + material.color);
    vec3 specular = light.specular * spec * texture(material.specular, TexCoords).rgb;
    ambient *= attenuation;
    diffuse *= attenuation;
    specular *= attenuation;
 
    return (ambient + diffuse + specular);
}

vec3 CalcSpotLight(SpotLight light, vec3 normal, vec3 fragPos, vec3 viewDir)
{
    vec3 lightDir = normalize(light.position - fragPos);
    
    // diffuse shading
    float diff = max(dot(normal, lightDir), 0.0);
    
    // specular shading
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfwayDir), 0.0), material.shininess);
    
    // attenuation
    float distance = length(light.position - fragPos);
    float attenuation = 1.0 / distance;

    // spotlight intensity
    float theta = dot(lightDir, normalize(-light.direction)); 
    float epsilon = light.cutOff - light.outerCutOff;
    float intensity = clamp((theta - light.outerCutOff) / epsilon, 0.0, 1.0);
    
    // combine results
    vec3 ambient = light.ambient * (texture(material.diffuse, TexCoords).rgb + material.color);
    vec3 diffuse = light.diffuse * diff * (texture(material.diffuse, TexCoords).rgb + material.color);
    vec3 specular = light.specular * spec * texture(material.specular, TexCoords).rgb;
    ambient *= attenuation * intensity;
    diffuse *= attenuation * intensity;
    specular *= attenuation * intensity;

    return (ambient + diffuse + specular);
}

float ShadowCalculation(vec4 fragPosLightSpace, vec3 normal, vec3 lightDir)
{
    // perform perspective divide
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    
    // transform to [0,1] range
    projCoords = projCoords * 0.5 + 0.5;
    
    if(projCoords.z > 1.0)
        return 0.0;

    // get closest depth value from light's perspective (using [0,1] range fragPosLight as coords)
    float closestDepth = texture(shadowMap, projCoords.xy).r;
    
    // get depth of current fragment from light's perspective with bias
    float bias = max(0.05 * (1.0 - dot(normal, lightDir)), 0.006);
    
    // PCF  - check whether current frag pos is in shadow
    float shadow = 0.0;
    vec2 texelSize = vec2(1.0, 1.0) / vec2(textureSize(shadowMap, 0));
    for(int x = -1; x <= 1; ++x)
    {
        for(int y = -1; y <= 1; ++y)
        {
            float pcfDepth = texture(shadowMap, projCoords.xy + vec2(x, y) * texelSize).r; 
            shadow += projCoords.z - bias > pcfDepth ? 1.0 : 0.0;        
        }    
    }

    return shadow / 9.0;
}
`
