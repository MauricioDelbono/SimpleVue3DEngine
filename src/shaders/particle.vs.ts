export default `#version 300 es
precision highp float;

in vec2 aPosition;
in vec2 aTexCoords;

in vec3 aInstancePosition;
in float aInstanceSize;
in vec4 aInstanceColor;

uniform mat4 view;
uniform mat4 projection;

out vec2 TexCoords;
out vec4 Color;

void main()
{
    vec3 cameraRight = vec3(view[0][0], view[1][0], view[2][0]);
    vec3 cameraUp = vec3(view[0][1], view[1][1], view[2][1]);

    vec3 vertexPos = aInstancePosition +
        cameraRight * aPosition.x * aInstanceSize +
        cameraUp * aPosition.y * aInstanceSize;

    gl_Position = projection * view * vec4(vertexPos, 1.0);
    TexCoords = aTexCoords;
    Color = aInstanceColor;
}
`
