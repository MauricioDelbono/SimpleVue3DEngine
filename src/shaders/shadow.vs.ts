export default `#version 300 es
in vec4 aPosition;

uniform mat4 viewProjection;
uniform mat4 model;

void main()
{
    gl_Position = viewProjection * model * aPosition;
}  
`
