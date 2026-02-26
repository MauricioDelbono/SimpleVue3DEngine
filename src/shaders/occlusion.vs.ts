export default `#version 300 es
layout(location = 0) in vec3 aPosition;

uniform mat4 model;
uniform mat4 viewProjection;

void main() {
  gl_Position = viewProjection * model * vec4(aPosition, 1.0);
}
`
