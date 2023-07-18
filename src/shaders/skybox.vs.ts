export default `#version 300 es
in vec4 aPosition;
out vec4 vPosition;
void main() {
  vPosition = aPosition;
  gl_Position = vec4(aPosition.xy, 1, 1);
}
`
