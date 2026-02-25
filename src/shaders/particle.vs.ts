export default `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoords;

// Instanced attributes
layout(location = 2) in vec3 iPosition;
layout(location = 3) in float iSize;
layout(location = 4) in vec4 iColor;

uniform mat4 view;
uniform mat4 projection;

out vec2 TexCoords;
out vec4 Color;

void main()
{
    TexCoords = aTexCoords;
    Color = iColor;

    // Billboard in View Space
    vec3 center = (view * vec4(iPosition, 1.0)).xyz;

    // Scale the quad based on size
    // aPosition is typically [-1, 1] or [-0.5, 0.5].
    // Primitives.createXYQuad(2) creates [-1, 1] range (size 2).
    // So if iSize is the desired diameter, we can use aPosition directly if size=1 mesh.
    // Let's assume iSize is the scaling factor.

    vec3 right = vec3(1.0, 0.0, 0.0) * iSize;
    vec3 up = vec3(0.0, 1.0, 0.0) * iSize;

    // Using aPosition.x and aPosition.y which are from the base quad
    vec3 vertexPos = center + right * aPosition.x + up * aPosition.y;

    gl_Position = projection * vec4(vertexPos, 1.0);
}
`
