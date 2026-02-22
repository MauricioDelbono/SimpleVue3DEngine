export default `#version 300 es
precision highp float;

layout (location = 0) out vec4 gPosition;
layout (location = 1) out vec4 gNormal;
layout (location = 2) out vec4 gAlbedoSpec;

in vec3 FragPos;
in vec3 Normal;
in vec2 TexCoords;

struct Material {
    vec3 color;
    sampler2D diffuse;
    sampler2D specular;
    sampler2D emission;
    float shininess;
};

uniform Material material;

void main()
{
    // 1. Position buffer: Store World Position
    // We can store generic depth or ID in alpha if needed, using 1.0 for now.
    gPosition = vec4(FragPos, 1.0);

    // 2. Normal buffer: Store Normal and Shininess
    gNormal = vec4(normalize(Normal), material.shininess);

    // 3. Albedo + Specular buffer
    // Calculate diffuse color (Texture + Color Tint)
    // Note: Replicating behavior from default.fs.ts where material.color is added
    vec3 textureColor = texture(material.diffuse, TexCoords).rgb;
    vec3 diffuseColor = textureColor + material.color;

    // Store Specular Intensity in Alpha
    float specularIntensity = texture(material.specular, TexCoords).r;

    gAlbedoSpec = vec4(diffuseColor, specularIntensity);
}
`
