export default `#version 300 es

in vec4 aPosition;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

void main()
{
	gl_Position = projection * view * model * aPosition;
}
`
