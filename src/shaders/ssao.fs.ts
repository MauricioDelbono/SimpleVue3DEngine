export default `#version 300 es
precision highp float;

out float FragColor;

in vec2 TexCoords;

uniform sampler2D gNormal;
uniform sampler2D gDepth;
uniform sampler2D texNoise;

uniform vec3 samples[64];
uniform mat4 projection;
uniform mat4 inverseProjection; // Inverse Projection Matrix
uniform vec2 noiseScale;
uniform int kernelSize;
uniform float radius;
uniform float bias;
uniform float power;

// Reconstruct view-space position from depth buffer
vec3 getViewPos(vec2 texCoord)
{
    float z = texture(gDepth, texCoord).r;
    // Transform from [0,1] to [-1,1]
    float z_ndc = z * 2.0 - 1.0;
    vec4 clipSpacePosition = vec4(texCoord * 2.0 - 1.0, z_ndc, 1.0);
    vec4 viewSpacePosition = inverseProjection * clipSpacePosition;
    return viewSpacePosition.xyz / viewSpacePosition.w;
}

void main()
{
    // Reconstruct view-space position of current fragment
    vec3 fragPos = getViewPos(TexCoords);

    // Get view-space normal
    vec3 normal = texture(gNormal, TexCoords).rgb;
    // normal is already normalized from geometry pass but texture sampling might introduce error
    normal = normalize(normal);

    // Get random vector
    vec3 randomVec = texture(texNoise, TexCoords * noiseScale).xyz;

    // Create TBN matrix
    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);

    float occlusion = 0.0;

    for(int i = 0; i < 64; ++i)
    {
        if (i >= kernelSize) break;

        // Get sample position
        vec3 samplePos = TBN * samples[i]; // From tangent to view-space
        samplePos = fragPos + samplePos * radius;

        // Project sample position (to sample texture)
        vec4 offset = vec4(samplePos, 1.0);
        offset = projection * offset; // from view to clip-space
        offset.xyz /= offset.w; // perspective divide
        offset.xyz = offset.xyz * 0.5 + 0.5; // transform to range 0.0 - 1.0

        // Get sample depth (view-space Z of the surface at sample position)
        vec3 sampleSurfacePos = getViewPos(offset.xy);
        float sampleDepth = sampleSurfacePos.z;

        // Range check & Accumulate
        // Note: View-space Z is negative.
        // If sampleDepth >= samplePos.z + bias, it means the surface is closer to camera (larger Z)
        // than the sample point, so it occludes the sample point.
        float rangeCheck = smoothstep(0.0, 1.0, radius / abs(fragPos.z - sampleDepth));

        occlusion += (sampleDepth >= samplePos.z + bias ? 1.0 : 0.0) * rangeCheck;
    }

    occlusion = 1.0 - (occlusion / float(kernelSize));
    FragColor = pow(occlusion, power);
}
`
