export default `#version 300 es
precision highp float;
precision highp sampler2D;

out float FragColor;

in vec2 TexCoords;

uniform sampler2D gNormal;
uniform sampler2D gDepth;
uniform sampler2D texNoise;

uniform vec3 samples[64];
uniform mat4 projection;
uniform mat4 inverseProjection;

// tile noise texture over screen based on screen dimensions divided by noise size
uniform vec2 noiseScale;
uniform float radius;
uniform float bias;
uniform int kernelSize;

vec3 getPosition(vec2 uv) {
    float depth = texture(gDepth, uv).r;
    // clip space position
    vec4 clipPos = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    // view space position
    vec4 viewPos = inverseProjection * clipPos;
    return viewPos.xyz / viewPos.w;
}

void main()
{
    vec3 fragPos = getPosition(TexCoords);
    vec3 normal = normalize(texture(gNormal, TexCoords).rgb);
    vec3 randomVec = normalize(texture(texNoise, TexCoords * noiseScale).xyz);

    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);

    float occlusion = 0.0;
    for(int i = 0; i < kernelSize; ++i)
    {
        // get sample position
        vec3 samplePos = TBN * samples[i]; // from tangent to view-space
        samplePos = fragPos + samplePos * radius;

        // project sample position (to sample texture) (to get position on screen/texture)
        vec4 offset = vec4(samplePos, 1.0);
        offset = projection * offset; // from view to clip-space
        offset.xyz /= offset.w; // perspective divide
        offset.xyz = offset.xyz * 0.5 + 0.5; // transform to range 0.0 - 1.0

        // get sample depth
        // checking boundary
        if (offset.x < 0.0 || offset.x > 1.0 || offset.y < 0.0 || offset.y > 1.0) continue;

        vec3 sampleDepthPos = getPosition(offset.xy);
        float sampleDepth = sampleDepthPos.z; // get depth value of kernel sample

        // range check & accumulate
        float rangeCheck = smoothstep(0.0, 1.0, radius / abs(fragPos.z - sampleDepth));
        occlusion += (sampleDepth >= samplePos.z + bias ? 1.0 : 0.0) * rangeCheck;
    }

    occlusion = 1.0 - (occlusion / float(kernelSize));
    FragColor = occlusion;
}
`
