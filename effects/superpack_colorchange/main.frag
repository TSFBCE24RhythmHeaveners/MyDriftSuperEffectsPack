#version 330 core

layout(location = 0) in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_sourceTexture;

// The JSON "name" maps explicitly to these variables
uniform float u_temperature; 
uniform float u_tint;        
uniform float u_saturation;  

void main() {
    vec4 sourceFrame = texture(u_sourceTexture, v_texCoord);
    vec3 rgb = sourceFrame.rgb;

    // 1. Temperature Calculation (Negative = Cool / Positive = Warm)
    rgb.r += u_temperature * 0.15;
    rgb.b -= u_temperature * 0.15;

    // 2. Tint Calculation (Negative = Green / Positive = Pink)
    rgb.g -= u_tint * 0.15;
    rgb.r += u_tint * 0.08;
    rgb.b += u_tint * 0.08;

    // 3. Saturation Mixer (Rec. 709 Luminance weights)
    float luma = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
    float satFactor = u_saturation + 1.0; 
    rgb = mix(vec3(luma), rgb, satFactor);

    fragColor = vec4(clamp(rgb, 0.0, 1.0), sourceFrame.a);
}
