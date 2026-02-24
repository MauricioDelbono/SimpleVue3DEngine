export default `#version 300 es
precision highp float;
layout (location = 0) out vec3 gNormal;

in vec3 ViewNormal;

void main()
{
    gNormal = normalize(ViewNormal);
}
`
