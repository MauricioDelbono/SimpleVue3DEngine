export default `#version 300 es
precision highp float;

layout (location = 0) out vec4 gNormal; // RGB = Normal, A = Linear Depth

in vec3 Normal;
in vec3 FragPos;

void main()
{
    gNormal.rgb = normalize(Normal);
    gNormal.a = FragPos.z;
}
`
