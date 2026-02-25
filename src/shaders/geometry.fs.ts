export default `#version 300 es
precision highp float;

in vec3 ViewPos;
in vec3 Normal;

layout (location = 0) out vec4 gNormal;

void main()
{
    // Store view space normal in RGB
    // Store linear depth (view space Z) in Alpha
    gNormal = vec4(normalize(Normal), ViewPos.z);
}
`
