export default `#version 300 es
layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec3 aNormal;

out vec3 ViewNormal;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform mat3 normalMatrix;

void main()
{
    vec4 viewPos = view * model * vec4(aPosition, 1.0);
    ViewNormal = normalMatrix * aNormal;
    gl_Position = projection * viewPos;
}
`
