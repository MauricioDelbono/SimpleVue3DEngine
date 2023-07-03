export default `#version 300 es
precision highp float;

uniform samplerCube uSkybox;
uniform mat4 uViewDirectionProjectionInverse;

in vec4 vPosition;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  vec4 t = uViewDirectionProjectionInverse * vPosition;
  outColor = texture(uSkybox, normalize(t.xyz / t.w));
}
`
