export default `#version 300 es
precision highp float;

out float FragColor;

in vec2 TexCoords;

uniform sampler2D gNormal;
uniform sampler2D texNoise;

uniform vec3 samples[64];
uniform mat4 projection;
uniform int kernelSize;
uniform float radius;
uniform float bias;
uniform float power;
uniform vec2 noiseScale;

void main()
{
    vec4 normalDepth = texture(gNormal, TexCoords);
    vec3 normal = normalDepth.rgb;
    float depth = normalDepth.a; // View Space Z

    // Reconstruct View Space Position
    vec3 viewPos;
    viewPos.z = depth;
    viewPos.x = (TexCoords.x * 2.0 - 1.0) * (-viewPos.z) / projection[0][0];
    viewPos.y = (TexCoords.y * 2.0 - 1.0) * (-viewPos.z) / projection[1][1];

    vec3 randomVec = texture(texNoise, TexCoords * noiseScale).xyz;
    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);

    float occlusion = 0.0;
    for(int i = 0; i < kernelSize; ++i)
    {
        // get sample position
        vec3 samplePos = TBN * samples[i]; // From tangent to view-space
        samplePos = viewPos + samplePos * radius;

        // project sample position (to sample texture) (to get position on screen/texture)
        vec4 offset = vec4(samplePos, 1.0);
        offset = projection * offset; // from view to clip-space
        offset.xyz /= offset.w; // perspective divide
        offset.xyz = offset.xyz * 0.5 + 0.5; // transform to range 0.0 - 1.0

        // get sample depth
        float sampleDepth = texture(gNormal, offset.xy).a; // Get depth of sample kernel

        // range check & accumulate
        float rangeCheck = smoothstep(0.0, 1.0, radius / abs(viewPos.z - sampleDepth));
        occlusion += (sampleDepth >= samplePos.z + bias ? 1.0 : 0.0) * rangeCheck;
    }

    occlusion = 1.0 - (occlusion / float(kernelSize));
    FragColor = pow(occlusion, power);
}
`
