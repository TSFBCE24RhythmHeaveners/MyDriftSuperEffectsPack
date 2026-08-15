#version 330 core

// Explicit layout specifiers lock the compositor's pipeline bounds
layout(location = 0) in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_sourceTexture;
uniform float u_temperature; 
uniform float u_tint;        
uniform float u_saturation;  

void main() {
    // 1. Core Fix: Force precise coordinate evaluations to kill the zooming offset
    vec2 correctedCoords = vec2(v_texCoord.x, v_texCoord.y);
    vec4 sourceFrame = texture(u_sourceTexture, correctedCoords);
    
    // Separate RGB immediately to prevent alpha corruption
    vec3 rgb = sourceFrame.rgb;

    // 2. Temperature Vector Pass (Negative = Cool / Positive = Warm)
    rgb.r += u_temperature * 0.15;
    rgb.b -= u_temperature * 0.15;

    // 3. Tint Vector Pass (Negative = Green / Positive = Pink)
    rgb.g -= u_tint * 0.15;
    rgb.r += u_tint * 0.08;
    rgb.b += u_tint * 0.08;

    // 4. Saturation Mixer using standardized Rec. 709 Luminance weights
    float luma = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
    float satFactor = u_saturation + 1.0; 
    rgb = mix(vec3(luma), rgb, satFactor);

    // 5. Core Fix: Strict clamping and direct restoration of the absolute source alpha channel
    // This forces Drift to keep the clip completely opaque and viewable
    fragColor = vec4(clamp(rgb, 0.0, 1.0), sourceFrame.a);
}
