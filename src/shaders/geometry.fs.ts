export default `#version 300 es
precision highp float;

layout (location = 0) out vec4 gNormal;
layout (location = 1) out vec4 gAlbedoSpec;

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
    // store the fragment normal into the gNormal buffer's RGB components
    gNormal.rgb = normalize(Normal);
    // store shininess in the alpha component
    gNormal.a = material.shininess;

    // store diffuse per-fragment color
    gAlbedoSpec.rgb = texture(material.diffuse, TexCoords).rgb * material.color;
    // store specular intensity in gAlbedoSpec's alpha component
    gAlbedoSpec.a = texture(material.specular, TexCoords).r;
}
`
