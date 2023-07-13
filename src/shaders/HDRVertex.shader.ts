export default `#version 300 es
precision highp float;

in vec4 aPosition;
in vec4 aNormal;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

out vec3 Normal;
out vec3 FragPos;

void main()
{
	gl_Position = projection * view * model * aPosition;
    FragPos = (model * aPosition).xyz;
	Normal = aNormal.xyz;
}
`
