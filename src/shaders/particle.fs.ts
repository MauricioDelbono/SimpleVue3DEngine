export default `#version 300 es
precision highp float;

in vec2 TexCoords;
in vec4 ParticleColor;

uniform sampler2D sprite;
uniform int hasTexture;

out vec4 FragColor;

void main()
{
    vec4 color = ParticleColor;
    if (hasTexture == 1) {
        color *= texture(sprite, TexCoords);
    }

    if (color.a < 0.1) discard;
    FragColor = color;
}
`
