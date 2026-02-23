export default `#version 300 es
layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec3 aNormal;

out vec3 Normal;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

void main()
{
    // Transform normal to view space
    mat3 normalMatrix = mat3(transpose(inverse(view * model)));
    Normal = normalize(normalMatrix * aNormal);

    gl_Position = projection * view * model * vec4(aPosition, 1.0);
}
`
