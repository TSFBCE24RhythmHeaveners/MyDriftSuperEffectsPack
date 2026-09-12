#version 330 core

in vec2 v_texCoord; out vec4 fragColor;
uniform sampler2D u_currentTexture; uniform vec2 u_resolution;
uniform float amount;
float GradientNoise(in vec2 fragCoord)
{
	return fract(52.9829189 * fract(dot(fragCoord, vec2(0.06711056, 0.00583715))));
}

void main()
{
    vec3 color = texture(u_currentTexture, v_texCoord).rgb;

    const float DITHER_AMOUNT = 1.0 / 255.0;
    float amount = DITHER_AMOUNT;
    color += DITHER_AMOUNT * GradientNoise(gl_FragCoord.xy);

    FragColor = vec4(color, 1.0);
}
