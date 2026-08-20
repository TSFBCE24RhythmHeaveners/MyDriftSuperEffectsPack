#version 330 core
in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_currentTexture;
uniform float strength;
uniform vec3 invertColor;
uniform float tintMode;

void main() {
    vec4 source = texture(u_currentTexture, v_texCoord);
    
    // Normalize strength from 0-100 to 0.0-1.0
    float normalizedStrength = clamp(strength, 0.0, 1.0);
    
    // Invert the RGB channels
    vec3 inverted = vec3(1.0) - source.rgb;
    
    vec3 result;
    
    if (tintMode < 0.5) {
        // Standard invert mode: invert then blend with original
        result = mix(source.rgb, inverted, normalizedStrength);
    } else {
        // Tint mode: invert the tint color and multiply by inverted image
        vec3 invertedTint = vec3(1.0) - invertColor;
        result = inverted * invertedTint;
        result = mix(source.rgb, result, normalizedStrength);
    }
    
    // Preserve alpha channel
    fragColor = vec4(result, source.a);
}
