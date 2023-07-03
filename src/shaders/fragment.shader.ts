export default `#version 300 es
precision highp float;

in vec4 vPosition;
in vec2 vTexCoord;
in vec3 vNormal;
in vec3 vSurfaceToLight;
in vec3 vSurfaceToView;

uniform vec4 uLightColor;
uniform vec4 uAlbedo;
uniform sampler2D uDiffuse;
uniform vec4 uSpecular;
uniform float uRoughness;
uniform float uSpecularFactor;
uniform vec4 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

out vec4 outColor;

vec4 lit(float l, float h, float m) {
    return vec4(1.0, l, (l > 0.0) ? pow(max(0.0, h), m) : 0.0, 1.0);
}

void main() {
    float fogAmount = smoothstep(uFogNear, uFogFar, gl_FragCoord.z);
    vec4 diffuseColor = texture(uDiffuse, vTexCoord) * uAlbedo;
    vec3 aNormal = normalize(vNormal);
    vec3 surfaceToLight = normalize(vSurfaceToLight);
    vec3 surfaceToView = normalize(vSurfaceToView);
    vec3 halfVector = normalize(surfaceToLight + surfaceToView);
    vec4 litR = lit(dot(aNormal, surfaceToLight), dot(aNormal, halfVector), uRoughness);
    outColor = vec4((uLightColor * (diffuseColor * litR.y + uSpecular * litR.z * uSpecularFactor)).rgb, diffuseColor.a);
    outColor = mix(outColor, uFogColor, fogAmount);
}
`
