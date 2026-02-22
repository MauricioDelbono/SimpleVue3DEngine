export default `#version 300 es
precision highp float;

layout (location = 0) in vec4 aPosition;
layout (location = 1) in vec4 aNormal;
layout (location = 2) in vec2 aTexCoords;

out vec3 FragPos;
out vec3 Normal;
out vec2 TexCoords;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

void main()
{
    vec4 viewPos = view * model * aPosition;
    FragPos = viewPos.xyz;

    mat3 normalMatrix = transpose(inverse(mat3(view * model)));
    Normal = normalMatrix * aNormal.xyz;

    TexCoords = aTexCoords;

    gl_Position = projection * viewPos;
}
`
