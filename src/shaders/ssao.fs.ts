export default `#version 300 es
precision highp float;

out float FragColor;

in vec2 TexCoords;

uniform sampler2D gNormal;
uniform sampler2D gDepth;
uniform sampler2D texNoise;

uniform vec3 samples[64];
uniform mat4 projection;
uniform mat4 inverseProjection;

uniform vec2 noiseScale;
uniform int kernelSize;
uniform float radius;
uniform float bias;
uniform float power;

vec3 getViewPos(vec2 texCoord)
{
    // Reconstruct view position from depth buffer
    float depth = texture(gDepth, texCoord).r;
    float z = depth * 2.0 - 1.0;

    vec4 clipSpacePosition = vec4(texCoord * 2.0 - 1.0, z, 1.0);
    vec4 viewSpacePosition = inverseProjection * clipSpacePosition;

    viewSpacePosition /= viewSpacePosition.w;

    return viewSpacePosition.xyz;
}

void main()
{
    // Reconstruct position for the current fragment
    vec3 fragPos = getViewPos(TexCoords);

    vec4 normalData = texture(gNormal, TexCoords);
    vec3 normal = normalData.rgb;

    vec3 randomVec = texture(texNoise, TexCoords * noiseScale).xyz;

    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);

    float occlusion = 0.0;

    for(int i = 0; i < kernelSize; ++i)
    {
        // get sample position
        vec3 samplePos = TBN * samples[i];
        samplePos = fragPos + samplePos * radius;

        vec4 offset = vec4(samplePos, 1.0);
        offset = projection * offset;
        offset.xyz /= offset.w;
        offset.xyz = offset.xyz * 0.5 + 0.5;

        // Optimization: Get linear depth directly from gNormal alpha channel
        float sampleDepth = texture(gNormal, offset.xy).a;

        // Range check & accumulate
        // Note: View space Z is negative. larger Z means closer to camera (e.g. -1 > -10).
        // But normally "depth" implies distance.
        // In RHS View Space, Z is negative.
        // abs(fragPos.z - sampleDepth) is distance between surface and sample kernel center depth?
        // No, sampleDepth is the actual surface depth at that screen coordinate.
        // samplePos.z is the depth of the sample kernel point.
        // We check if the sample kernel point (samplePos.z) is BEHIND the surface (sampleDepth).
        // In negative Z, "behind" means sampleDepth > samplePos.z (e.g. -10 is behind -5? No, -10 is further).
        // Wait, standard OpenGL: Camera at 0, looking down -Z.
        // Closer objects have Z = -1. Farther objects have Z = -100.
        // If samplePos.z is -5, and surface at that pixel is -4 (closer), then occlusion is 0 (sample is in front).
        // If surface is -6 (farther), then occlusion is 1 (sample is occluded).
        // So condition: sampleDepth >= samplePos.z + bias?
        // -6 >= -5 + bias? No.
        // We want: if surface (sampleDepth) is CLOSER (larger value, e.g. -4) than samplePos (-5), then samplePos is occluded?
        // No, SSAO measures if the HEMISPHERE around the surface point is occluded by OTHER geometry.
        // We cast a ray from fragPos to samplePos.
        // We check the actual depth at samplePos's screen coordinate.
        // If the actual depth (sampleDepth) is CLOSER to the camera than samplePos.z, then samplePos is inside geometry -> occluded.
        // sampleDepth (surface) > samplePos.z (sample point)?
        // Example: sampleDepth = -4 (surface), samplePos.z = -5 (point in hemisphere).
        // -4 > -5. True. Occluded.
        // Example: sampleDepth = -6 (surface), samplePos.z = -5.
        // -6 > -5. False. Not occluded.
        // So logic: if (sampleDepth >= samplePos.z + bias) occlusion += 1.0;

        float rangeCheck = smoothstep(0.0, 1.0, radius / abs(fragPos.z - sampleDepth));
        occlusion += (sampleDepth >= samplePos.z + bias ? 1.0 : 0.0) * rangeCheck;
    }

    occlusion = 1.0 - (occlusion / float(kernelSize));
    FragColor = pow(occlusion, power);
}
`
