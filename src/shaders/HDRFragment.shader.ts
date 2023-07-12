export default `#version 300 es
precision highp float;

out vec4 FragColor;
  
uniform vec4 objectColor;
uniform vec4 lightColor;

void main()
{
    FragColor = lightColor * objectColor;
}
`
