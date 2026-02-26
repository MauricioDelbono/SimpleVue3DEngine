export default `#version 300 es
precision highp float;

layout (location = 0) in vec2 aPosition;
layout (location = 1) in vec2 aTextureCoords;

out vec2 TexCoords;

void main()
{
    TexCoords = aTextureCoords;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`
