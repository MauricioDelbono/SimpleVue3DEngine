export default `#version 300 es
precision highp float;
layout (location = 0) out vec3 gNormal;

in vec3 Normal;

void main()
{
    // Store the fragment normal into the gbuffer normal texture
    // Since we use RGB16F, we can store negative values directly
    gNormal = normalize(Normal);
}
`
