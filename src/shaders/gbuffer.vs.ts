export default `#version 300 es
precision highp float;

in vec4 aPosition;
in vec4 aNormal;
in vec2 aTexCoords;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

out vec3 FragPos;
out vec3 Normal;
out vec2 TexCoords;

void main()
{
    vec4 worldPos = model * aPosition;
    FragPos = worldPos.xyz;
    TexCoords = aTexCoords;

    mat3 normalMatrix = transpose(inverse(mat3(model)));
    Normal = normalMatrix * aNormal.xyz;

    gl_Position = projection * view * worldPos;
}
`
