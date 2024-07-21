export default `#version 300 es
in vec3 aPosition;
in vec2 aTextureCoords;

out vec2 TexCoords;

void main()
{
    TexCoords = aTextureCoords;
    gl_Position = vec4(aPosition, 1.0);
}
`
