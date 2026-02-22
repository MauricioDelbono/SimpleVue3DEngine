#version 300 es
layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aTexCoords;
layout (location = 2) in vec3 aOffset;
layout (location = 3) in vec4 aColor;
layout (location = 4) in float aSize;

out vec2 TexCoords;
out vec4 ParticleColor;

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;

void main()
{
    float scale = aSize;
    TexCoords = aTexCoords;
    ParticleColor = aColor;

    // 1. Calculate the particle center in World Space
    vec4 worldCenter = model * vec4(aOffset, 1.0);

    // 2. Get Camera Right and Up vectors in World Space from View Matrix
    // The View Matrix transforms World -> Camera.
    // The upper-left 3x3 is the rotation matrix R.
    // The rows of R correspond to the Camera's Right, Up, and Forward axes in World Space.
    // GLSL matrices are column-major, so view[col][row].
    // We want the rows of the matrix, which means we access view[0][0], view[1][0], view[2][0] for the first row.
    vec3 cameraRight = vec3(view[0][0], view[1][0], view[2][0]);
    vec3 cameraUp = vec3(view[0][1], view[1][1], view[2][1]);

    // 3. Billboard the quad
    // We expand the quad vertex (aPosition) along the camera-aligned axes.
    vec3 worldPos = worldCenter.xyz +
                    cameraRight * aPosition.x * scale +
                    cameraUp * aPosition.y * scale;

    gl_Position = projection * view * vec4(worldPos, 1.0);
}
