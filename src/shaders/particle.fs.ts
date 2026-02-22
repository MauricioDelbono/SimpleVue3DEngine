export default `#version 300 es
precision highp float;

in vec4 vColor;
out vec4 FragColor;

void main() {
    FragColor = vColor;
    if (FragColor.a < 0.01) discard;
}
`
