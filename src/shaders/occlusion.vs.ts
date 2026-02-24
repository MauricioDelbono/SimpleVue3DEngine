export default `#version 300 es
precision highp float;

in vec4 aPosition;

uniform mat4 model;
uniform mat4 viewProjection;

void main()
{
    gl_Position = viewProjection * model * aPosition;
}
`
