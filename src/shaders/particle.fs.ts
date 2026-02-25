export default `#version 300 es
precision highp float;

in vec2 TexCoords;
in vec4 Color;

uniform sampler2D uTexture;
uniform bool uHasTexture;

out vec4 FragColor;

void main()
{
    vec4 texColor = vec4(1.0);
    if (uHasTexture) {
        texColor = texture(uTexture, TexCoords);
    }
    FragColor = texColor * Color;

    // Optional: discard if alpha is too low
    if (FragColor.a < 0.01) {
        discard;
    }
}
`
