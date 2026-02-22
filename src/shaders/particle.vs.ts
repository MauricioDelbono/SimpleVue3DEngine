export default `#version 300 es
layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aTexCoords;

// Instanced attributes
layout (location = 2) in vec3 iPosition;
layout (location = 3) in vec4 iColor;
layout (location = 4) in float iSize;

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;

out vec4 vColor;

void main() {
    vColor = iColor;

    // Billboarding logic
    // Extract camera right and up vectors from view matrix (columns of the transpose / rows of the view)
    vec3 cameraRight = vec3(view[0][0], view[1][0], view[2][0]);
    vec3 cameraUp = vec3(view[0][1], view[1][1], view[2][1]);

    // Calculate World Position of the particle center
    vec4 worldCenter = model * vec4(iPosition, 1.0);

    // Add billboard offsets (in World Space, aligned with Camera)
    vec3 position = worldCenter.xyz
        + cameraRight * aPosition.x * iSize
        + cameraUp * aPosition.y * iSize;

    gl_Position = projection * view * vec4(position, 1.0);
}
`
