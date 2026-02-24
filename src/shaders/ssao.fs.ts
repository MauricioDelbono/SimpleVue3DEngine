export default `#version 300 es
precision highp float;

out float FragColor;

in vec2 TexCoords;

uniform sampler2D gNormal;
uniform sampler2D gDepth;
uniform sampler2D texNoise;

uniform vec3 samples[64];
uniform int kernelSize;
uniform float radius;
uniform float bias;
uniform float power;

uniform vec2 screenSize;
uniform mat4 projection;
uniform mat4 inverseProjection;

vec3 getViewPos(vec2 texCoord)
{
    float depth = texture(gDepth, texCoord).r;
    float z = depth * 2.0 - 1.0;
    vec4 clipSpacePosition = vec4(texCoord * 2.0 - 1.0, z, 1.0);
    vec4 viewSpacePosition = inverseProjection * clipSpacePosition;
    return viewSpacePosition.xyz / viewSpacePosition.w;
}

void main()
{
    vec2 noiseScale = screenSize / 4.0;

    vec3 fragPos = getViewPos(TexCoords);
    vec3 normal = normalize(texture(gNormal, TexCoords).rgb);
    vec3 randomVec = normalize(texture(texNoise, TexCoords * noiseScale).xyz);

    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);

    float occlusion = 0.0;

    for(int i = 0; i < kernelSize; ++i)
    {
        // get sample position
        vec3 samplePos = TBN * samples[i]; // From tangent to view-space
        samplePos = fragPos + samplePos * radius;

        // project sample position (to sample texture) (to get position on screen/texture)
        vec4 offset = vec4(samplePos, 1.0);
        offset = projection * offset; // from view to clip-space
        offset.xyz /= offset.w; // perspective divide
        offset.xyz = offset.xyz * 0.5 + 0.5; // transform to range 0.0 - 1.0

        // get sample depth
        float sampleDepth = texture(gDepth, offset.xy).r; // get depth value of kernel sample

        // reconstruct view space depth from sampleDepth (non-linear)
        // Wait, sampleDepth is non-linear [0,1].
        // We can just reconstruct the Z position of the sample point on the geometry.

        float z = sampleDepth * 2.0 - 1.0;
        vec4 clipSpaceSample = vec4(offset.xy * 2.0 - 1.0, z, 1.0);
        vec4 viewSpaceSample = inverseProjection * clipSpaceSample;
        viewSpaceSample /= viewSpaceSample.w;
        float sampleLinearDepth = viewSpaceSample.z; // View space Z (negative usually)

        // Range check & Accumulate
        // view space z is negative, so closer to camera is larger (less negative)? No, smaller (more positive? No).
        // Standard view space: -Z is forward. Camera at 0,0,0.
        // Z = -1 is close, Z = -100 is far.
        // fragPos.z is e.g. -10. samplePos.z is -10.5.
        // sampleLinearDepth is the surface depth at that screen coordinate.
        // If surface depth is -9 (closer to camera) and samplePos is -10.5 (behind surface), then occlusion.
        // We check if samplePos.z < sampleLinearDepth (meaning samplePos is BEHIND the surface)
        // Note: dealing with negative values carefully.
        // sampleLinearDepth > samplePos.z ? 1.0 : 0.0

        float rangeCheck = smoothstep(0.0, 1.0, radius / abs(fragPos.z - sampleLinearDepth));
        occlusion += (sampleLinearDepth >= samplePos.z + bias ? 1.0 : 0.0) * rangeCheck;
    }

    occlusion = 1.0 - (occlusion / float(kernelSize));
    FragColor = pow(occlusion, power);
}
`
