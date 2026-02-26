export default `#version 300 es
precision highp float;

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec3 aNormal;
// layout (location = 2) in vec2 aTexCoords;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

out vec3 Normal;
out vec3 FragPos;

void main()
{
    vec4 viewPos = view * model * vec4(aPosition, 1.0);
    FragPos = viewPos.xyz;
    mat3 normalMatrix = transpose(inverse(mat3(view * model)));
    Normal = normalMatrix * aNormal;
    gl_Position = projection * viewPos;
}
`
