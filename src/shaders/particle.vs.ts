export default `#version 300 es
layout (location = 0) in vec2 aPosition;
layout (location = 1) in vec2 aTexCoords;
layout (location = 2) in vec3 aOffset; // Instance Position
layout (location = 3) in vec4 aColor;  // Instance Color
layout (location = 4) in float aSize;  // Instance Size

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;

out vec2 TexCoords;
out vec4 ParticleColor;

void main()
{
    float scale = aSize;
    TexCoords = aTexCoords;
    ParticleColor = aColor;

    // Transform instance position to view space
    // aOffset is the particle position in local space (if model is used) or world space (if model is identity)
    vec4 viewPos = view * model * vec4(aOffset, 1.0);

    // Billboarding: add vertex offset in view space
    // This ensures the quad always faces the camera
    viewPos.xy += aPosition * scale;

    gl_Position = projection * viewPos;
}
`
