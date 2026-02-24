export default `#version 300 es
precision highp float;

in vec2 vTexCoords;
in vec4 vColor;

out vec4 FragColor;

uniform sampler2D uTexture;
uniform bool uUseTexture;

void main() {
    vec4 texColor = vec4(1.0);
    if (uUseTexture) {
        texColor = texture(uTexture, vTexCoords);
    }
    FragColor = vColor * texColor;
}
`
