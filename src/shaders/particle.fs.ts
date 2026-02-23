export default `#version 300 es
precision highp float;

in vec2 TexCoords;
in vec4 Color;

out vec4 FragColor;

void main()
{
    FragColor = Color;
}
`
