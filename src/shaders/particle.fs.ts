export default `#version 300 es
precision mediump float;

in vec2 TexCoords;
in vec4 ParticleColor;

out vec4 FragColor;

uniform sampler2D sprite;
uniform bool hasTexture;

void main()
{
    if (hasTexture) {
        FragColor = texture(sprite, TexCoords) * ParticleColor;
    } else {
        FragColor = ParticleColor;
    }
}
`
