export default `#version 300 es
precision highp float;
precision mediump sampler2DArray;

out vec4 FragColor;

in vec2 TexCoords;

uniform sampler2D gPosition;
uniform sampler2D gNormal;
uniform sampler2D gAlbedoSpec;
uniform sampler2DArray shadowMap;

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

#define NR_POINT_LIGHTS 32

uniform vec3 viewPos;
uniform DirLight dirLight;
uniform SpotLight spotLight;
uniform PointLight pointLights[NR_POINT_LIGHTS];

uniform int cascadeCount;
uniform float cascadePlaneDistances[4];
uniform mat4 lightSpaceMatrices[4];
uniform mat4 view;

// Function prototypes
float ShadowCalculation(vec3 fragPosWorld, vec3 normal, vec3 lightDir);
vec3 CalcDirLight(DirLight light, vec3 normal, vec3 viewDir, vec3 albedo, float specular, float shininess, vec3 fragPos);
vec3 CalcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 viewDir, vec3 albedo, float specular, float shininess);
vec3 CalcSpotLight(SpotLight light, vec3 normal, vec3 fragPos, vec3 viewDir, vec3 albedo, float specular, float shininess);

void main()
{
    // Retrieve data from G-buffer
    vec3 FragPos = texture(gPosition, TexCoords).rgb;
    vec3 Normal = texture(gNormal, TexCoords).rgb;
    float Shininess = texture(gNormal, TexCoords).a;
    vec3 Albedo = texture(gAlbedoSpec, TexCoords).rgb;
    float Specular = texture(gAlbedoSpec, TexCoords).a;

    // Check if fragment is valid (rendered)
    // If normal length is near 0, it means we sampled background
    if (length(Normal) < 0.1) {
        discard;
    }

    vec3 norm = normalize(Normal);
    vec3 viewDir = normalize(viewPos - FragPos);
    vec3 result = vec3(0.0);

    // Phase 1: Directional lighting
    if (dirLight.enabled)
        result += CalcDirLight(dirLight, norm, viewDir, Albedo, Specular, Shininess, FragPos);

    // Phase 2: Point lights
    for(int i = 0; i < NR_POINT_LIGHTS; ++i)
    {
        if (pointLights[i].enabled)
             result += CalcPointLight(pointLights[i], norm, FragPos, viewDir, Albedo, Specular, Shininess);
    }

    // Phase 3: Spot light
    if (spotLight.enabled)
        result += CalcSpotLight(spotLight, norm, FragPos, viewDir, Albedo, Specular, Shininess);

    FragColor = vec4(result, 1.0);

    // Gamma correction
    float gamma = 2.2;
    FragColor.rgb = pow(FragColor.rgb, vec3(1.0/gamma));
}

vec3 CalcDirLight(DirLight light, vec3 normal, vec3 viewDir, vec3 albedo, float specular, float shininess, vec3 fragPos)
{
    vec3 lightDir = normalize(-light.direction);

    // Diffuse shading
    float diff = max(dot(normal, lightDir), 0.0);

    // Specular shading
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfwayDir), 0.0), shininess);

    // Combine results
    vec3 ambient  = light.ambient  * albedo;
    vec3 diffuse  = light.diffuse  * diff * albedo;
    vec3 specularColor = light.specular * spec * specular; // Assuming white specular color for now

    // Shadow
    float shadow = ShadowCalculation(fragPos, normal, lightDir);

    return (ambient + (1.0 - shadow) * (diffuse + specularColor));
}

vec3 CalcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 viewDir, vec3 albedo, float specular, float shininess)
{
    vec3 lightDir = normalize(light.position - fragPos);

    // Diffuse shading
    float diff = max(dot(normal, lightDir), 0.0);

    // Specular shading
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfwayDir), 0.0), shininess);

    // Attenuation
    float distance = length(light.position - fragPos);
    float attenuation = 1.0 / (distance); // Simple linear/constant falloff or inverse square?
    // Default shader used 1.0/distance which is linear-ish but technically 1/r.
    // Usually it's 1/(c + l*d + q*d*d).
    // Sticking to default shader logic: 1.0 / distance

    // Combine results
    vec3 ambient  = light.ambient  * albedo;
    vec3 diffuse  = light.diffuse  * diff * albedo;
    vec3 specularColor = light.specular * spec * specular;

    ambient  *= attenuation;
    diffuse  *= attenuation;
    specularColor *= attenuation;

    return (ambient + diffuse + specularColor);
}

vec3 CalcSpotLight(SpotLight light, vec3 normal, vec3 fragPos, vec3 viewDir, vec3 albedo, float specular, float shininess)
{
    vec3 lightDir = normalize(light.position - fragPos);

    // Diffuse shading
    float diff = max(dot(normal, lightDir), 0.0);

    // Specular shading
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfwayDir), 0.0), shininess);

    // Attenuation
    float distance = length(light.position - fragPos);
    float attenuation = 1.0 / distance;

    // Spotlight intensity
    float theta = dot(lightDir, normalize(-light.direction));
    float epsilon = light.cutOff - light.outerCutOff;
    float intensity = clamp((theta - light.outerCutOff) / epsilon, 0.0, 1.0);

    // Combine results
    vec3 ambient  = light.ambient  * albedo;
    vec3 diffuse  = light.diffuse  * diff * albedo;
    vec3 specularColor = light.specular * spec * specular;

    ambient  *= attenuation * intensity;
    diffuse  *= attenuation * intensity;
    specularColor *= attenuation * intensity;

    return (ambient + diffuse + specularColor);
}

float ShadowCalculation(vec3 fragPosWorld, vec3 normal, vec3 lightDir)
{
    // Get view space depth
    vec4 fragPosView = view * vec4(fragPosWorld, 1.0);
    float depthValue = abs(fragPosView.z);

    int layer = -1;
    for(int i = 0; i < cascadeCount; ++i)
    {
        if (depthValue < cascadePlaneDistances[i])
        {
            layer = i;
            break;
        }
    }
    if (layer == -1)
    {
        layer = cascadeCount - 1; // Last cascade
    }

    vec4 fragPosLightSpace = lightSpaceMatrices[layer] * vec4(fragPosWorld, 1.0);
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    projCoords = projCoords * 0.5 + 0.5;

    float currentDepth = projCoords.z;
    if (currentDepth > 1.0)
        return 0.0;

    float bias = max(0.005 * (1.0 - dot(normal, lightDir)), 0.0005);
    if (layer == cascadeCount)
    {
        bias *= 1.0 / (50.0 * 0.5);
    }
    else
    {
        bias *= 1.0 / (cascadePlaneDistances[layer] * 0.5);
    }

    float shadow = 0.0;
    vec2 texelSize = 1.0 / vec2(textureSize(shadowMap, 0).xy);
    for(int x = -1; x <= 1; ++x)
    {
        for(int y = -1; y <= 1; ++y)
        {
            float pcfDepth = texture(shadowMap, vec3(projCoords.xy + vec2(x, y) * texelSize, float(layer))).r;
            shadow += currentDepth - bias > pcfDepth ? 1.0 : 0.0;
        }
    }
    shadow /= 9.0;

    return shadow;
}
`
