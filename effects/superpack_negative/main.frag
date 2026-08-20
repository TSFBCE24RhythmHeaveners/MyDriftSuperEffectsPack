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
        result = mix(source.rgb, inverted, normalizedStrength);
    } else if (tintMode > 0.5 && tintMode < 1.5) {
        float tintIntensity = length(invertColor) / sqrt(3.0);
        vec3 difference = abs(inverted - invertColor);
        vec3 blended = mix(source.rgb, difference, tintIntensity);
        blended = mix(blended, inverted, tintIntensity);
        result = mix(source.rgb, blended, normalizedStrength);
    } else {
        vec3 difference = abs(inverted - invertColor);
        result = mix(source.rgb, difference, normalizedStrength);
    }
    
    // Preserve alpha channel
    fragColor = vec4(result, source.a);
}
