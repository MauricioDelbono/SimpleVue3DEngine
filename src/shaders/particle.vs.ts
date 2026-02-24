export default `#version 300 es
layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aTexCoords;

// Instance attributes
layout (location = 2) in vec3 iPosition;
layout (location = 3) in float iSize;
layout (location = 4) in vec4 iColor;

uniform mat4 view;
uniform mat4 projection;

out vec2 vTexCoords;
out vec4 vColor;

void main() {
    vTexCoords = aTexCoords;
    vColor = iColor;

    // View-space billboarding
    // Transform center to view space
    vec4 viewPos = view * vec4(iPosition, 1.0);

    // Add vertex offset in view space (billboard always faces camera)
    // aPosition is defined in XY plane, so we just add x and y
    viewPos.xy += aPosition.xy * iSize;

    gl_Position = projection * viewPos;
}
`
