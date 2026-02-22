export default `#version 300 es
precision highp float;

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D colorTexture;
uniform sampler2D depthTexture;

uniform float focusDistance;
uniform float focusRange;
uniform float bokehRadius;
uniform float nearPlane;
uniform float farPlane;

float LinearizeDepth(float depth)
{
    float z = depth * 2.0 - 1.0; // Back to NDC
    return (2.0 * nearPlane * farPlane) / (farPlane + nearPlane - z * (farPlane - nearPlane));
}

void main()
{
    float depth = texture(depthTexture, TexCoords).r;
    float linearDepth = LinearizeDepth(depth);

    float blurFactor = 0.0;
    float dist = abs(linearDepth - focusDistance);

    if (dist > focusRange) {
        blurFactor = (dist - focusRange);
        // Clamp to max radius to prevent extreme performance hit or ghosting if we used variable loop
        // Here we use it as a stride multiplier.
        blurFactor = clamp(blurFactor, 0.0, bokehRadius);
    }

    if (blurFactor < 0.1) {
        FragColor = texture(colorTexture, TexCoords);
        return;
    }

    vec3 color = vec3(0.0);
    float total = 0.0;

    vec2 texSize = vec2(textureSize(colorTexture, 0));
    vec2 onePixel = vec2(1.0, 1.0) / texSize;

    // 5x5 Grid sampling
    for (float x = -2.0; x <= 2.0; x += 1.0) {
        for (float y = -2.0; y <= 2.0; y += 1.0) {
            vec2 offset = vec2(x, y) * blurFactor * onePixel;
            color += texture(colorTexture, TexCoords + offset).rgb;
            total += 1.0;
        }
    }

    FragColor = vec4(color / total, 1.0);
}
`
