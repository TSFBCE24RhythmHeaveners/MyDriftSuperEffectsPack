#version 330 core
in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_currentTexture;
uniform float strength;
uniform vec3 invertColor;

void main() {
    vec4 source = texture(u_currentTexture, v_texCoord);
    
    // Normalize strength from 0-100 to 0.0-1.0
    float normalizedStrength = clamp(strength, 0.0, 1.0);
    
    // Invert the RGB channels
    vec3 inverted = vec3(1.0) - source.rgb;
    
    // Blend inverted color with the invert effect
    vec3 blended = mix(inverted, invertColor, (1.0 - normalizedStrength));
    
    // Apply strength as a blend between original and effect
    vec3 result = mix(source.rgb, blended, normalizedStrength);
    
    // Preserve alpha channel
    fragColor = vec4(result, source.a);
}
