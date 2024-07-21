export default `#version 300 es
precision highp float;

in vec4 aPosition;
in vec4 aNormal;
in vec2 aTexCoords;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform mat4 lightViewProjectionMatrix;

out vec3 Normal;
out vec3 FragPos;
out vec2 TexCoords;
out vec4 FragPosLightSpace;

void main()
{
    FragPos = (model * aPosition).xyz;
	Normal = aNormal.xyz;
    TexCoords = aTexCoords;
    FragPosLightSpace = lightViewProjectionMatrix * model * aPosition;
	gl_Position = projection * view * model * aPosition;
}
`
