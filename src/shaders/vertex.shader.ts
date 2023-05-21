export default `#version 300 es

uniform mat4 uModelViewProjection;
uniform vec3 uLightDirection;
uniform mat4 uModel;
uniform mat4 uCamera;
uniform mat4 uModelInverseTranspose;

in vec4 aPosition;
in vec3 aNormal;
in vec2 aTextureCoords;

out vec4 vPosition;
out vec2 vTexCoord;
out vec3 vNormal;
out vec3 vSurfaceToLight;
out vec3 vSurfaceToView;

void main() {
    vTexCoord = aTextureCoords;
    vPosition = (uModelViewProjection * aPosition);
    vNormal = (uModelInverseTranspose * vec4(aNormal, 0)).xyz;
    vSurfaceToLight = uLightDirection - (uModel * aPosition).xyz;
    vSurfaceToView = (uCamera[3] - (uModel * aPosition)).xyz;
    gl_Position = vPosition;
}
`
