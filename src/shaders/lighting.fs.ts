export default `#version 300 es
precision highp float;
precision mediump sampler2DArray;

out vec4 FragColor;

in vec2 TexCoords;

uniform sampler2D gNormal;
uniform sampler2D gAlbedoSpec;
uniform sampler2D gDepth;
uniform sampler2D ssaoInput;

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

#define NR_POINT_LIGHTS 4

uniform vec3 viewPos;
uniform DirLight dirLight;
uniform SpotLight spotLight;
uniform PointLight pointLights[NR_POINT_LIGHTS];
uniform sampler2DArray shadowMap;

uniform int cascadeCount;
uniform float cascadePlaneDistances[4];
uniform mat4 lightSpaceMatrices[4];
uniform mat4 view; // View Matrix
uniform mat4 inverseProjection; // Inverse Projection Matrix
uniform mat4 inverseView; // Inverse View Matrix (Camera World Matrix)

// function prototypes
float ShadowCalculation(vec3 fragPosWorld, vec3 normal, vec3 lightDir);
vec3 CalcDirLight(DirLight light, vec3 normal, vec3 viewDir, vec3 albedo, float specularIntensity, float shininess, float ssao);
vec3 CalcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 viewDir, vec3 albedo, float specularIntensity, float shininess);
vec3 CalcSpotLight(SpotLight light, vec3 normal, vec3 fragPos, vec3 viewDir, vec3 albedo, float specularIntensity, float shininess);

vec3 getWorldPosition(vec2 uv) {
    float depth = texture(gDepth, uv).r;
    // clip space position
    vec4 clipPos = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    // view space position
    vec4 viewPos = inverseProjection * clipPos;
    viewPos /= viewPos.w;
    // world space position
    vec4 worldPos = inverseView * viewPos;
    return worldPos.xyz;
}

void main()
{
    // retrieve data from G-buffer
    vec3 FragPos = getWorldPosition(TexCoords);
    vec4 normalData = texture(gNormal, TexCoords);
    vec3 Normal = normalize(mat3(inverseView) * normalData.rgb); // Transform View Space Normal to World Space
    float Shininess = normalData.a;

    vec4 albedoSpec = texture(gAlbedoSpec, TexCoords);
    vec3 Albedo = albedoSpec.rgb;
    float Specular = albedoSpec.a;

    float SSAO = texture(ssaoInput, TexCoords).r;

    // lighting
    vec3 viewDir = normalize(viewPos - FragPos);
    vec3 result = vec3(0.0);

    // phase 1: Directional lighting
    if (dirLight.enabled)
        result += CalcDirLight(dirLight, Normal, viewDir, Albedo, Specular, Shininess, SSAO);

    // phase 2: Point lights
    for(int i = 0; i < NR_POINT_LIGHTS; i++) {
        if (pointLights[i].enabled)
            result += CalcPointLight(pointLights[i], Normal, FragPos, viewDir, Albedo, Specular, Shininess);
    }

    // phase 3: Spot light
    if (spotLight.enabled)
        result += CalcSpotLight(spotLight, Normal, FragPos, viewDir, Albedo, Specular, Shininess);

    FragColor = vec4(result, 1.0);

    // apply gamma correction
    float gamma = 2.2;
    FragColor.rgb = pow(FragColor.rgb, vec3(1.0/gamma));
}

vec3 CalcDirLight(DirLight light, vec3 normal, vec3 viewDir, vec3 albedo, float specularIntensity, float shininess, float ssao)
{
    vec3 lightDir = normalize(-light.direction);

    // diffuse shading
    float diff = max(dot(normal, lightDir), 0.0);

    // specular shading
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfwayDir), 0.0), shininess);

    // combine results
    vec3 ambient = light.ambient * albedo * ssao; // Apply SSAO to ambient
    vec3 diffuse = light.diffuse * diff * albedo;
    vec3 specular = light.specular * spec * specularIntensity; // Use specular intensity from G-Buffer

    // calculate shadow
    float shadow = ShadowCalculation(getWorldPosition(TexCoords), normal, lightDir);
    return ambient + (1.0 - shadow) * (diffuse + specular);
}

vec3 CalcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 viewDir, vec3 albedo, float specularIntensity, float shininess)
{
    vec3 lightDir = normalize(light.position - fragPos);

    // diffuse shading
    float diff = max(dot(normal, lightDir), 0.0);

    // specular shading
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfwayDir), 0.0), shininess);

    // attenuation
    float distance = length(light.position - fragPos);
    float attenuation = 1.0 / distance; // Inverse Linear attenuation for simplicity matching default
    // Note: default.fs used 1.0 / distance, which is physically incorrect but consistent with existing code

    // combine results
    vec3 ambient = light.ambient * albedo; // No SSAO for point lights? Usually SSAO is ambient only.
    vec3 diffuse = light.diffuse * diff * albedo;
    vec3 specular = light.specular * spec * specularIntensity;
    ambient *= attenuation;
    diffuse *= attenuation;
    specular *= attenuation;

    return (ambient + diffuse + specular);
}

vec3 CalcSpotLight(SpotLight light, vec3 normal, vec3 fragPos, vec3 viewDir, vec3 albedo, float specularIntensity, float shininess)
{
    vec3 lightDir = normalize(light.position - fragPos);

    // diffuse shading
    float diff = max(dot(normal, lightDir), 0.0);

    // specular shading
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfwayDir), 0.0), shininess);

    // attenuation
    float distance = length(light.position - fragPos);
    float attenuation = 1.0 / distance;

    // spotlight intensity
    float theta = dot(lightDir, normalize(-light.direction));
    float epsilon = light.cutOff - light.outerCutOff;
    float intensity = clamp((theta - light.outerCutOff) / epsilon, 0.0, 1.0);

    // combine results
    vec3 ambient = light.ambient * albedo;
    vec3 diffuse = light.diffuse * diff * albedo;
    vec3 specular = light.specular * spec * specularIntensity;
    ambient *= attenuation * intensity;
    diffuse *= attenuation * intensity;
    specular *= attenuation * intensity;

    return (ambient + diffuse + specular);
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
