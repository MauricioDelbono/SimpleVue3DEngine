export default `#version 300 es
precision highp float;

out vec4 FragColor;

in vec2 TexCoords;

uniform sampler2D shadowMap;
uniform float nearPlane;
uniform float farPlane;

// required when using a perspective projection matrix
float LinearizeDepth(float depth)
{
    float z = depth * 2.0 - 1.0; // Back to NDC 
    return (2.0 * nearPlane * farPlane) / (farPlane + nearPlane - z * (farPlane - nearPlane));	
}

void main()
{             
    float depthValue = texture(shadowMap, TexCoords).r;
    // FragColor = vec4(vec3(LinearizeDepth(depthValue) / farPlane), 1.0); // perspective
    FragColor = vec4(vec3(depthValue), 1.0); // orthographic
    // FragColor = vec4(0.5, 0.5, 0.5, 1.0);
}
`
