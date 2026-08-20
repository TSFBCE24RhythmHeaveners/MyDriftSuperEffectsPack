#version 330 core
in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_currentTexture;
uniform float strength;
uniform vec3 invertColor; // per-channel mask: 1 = invert that channel, 0 = leave it

void main() {
    vec4 source = texture(u_currentTexture, v_texCoord);
    
    // Normalize strength from 0-100 to 0.0-1.0
    float normalizedStrength = clamp(strength, 0.0, 1.0);
    
    // Invert the RGB channels
    vec3 inverted = vec3(1.0) - source.rgb;
    
    // Use invertColor as a per-channel mask: each component controls inversion for that channel.
    // e.g. (1,0,0) = invert red only, (1,1,0) = invert red+green, (1,1,1) = full inversion.
    vec3 mask = clamp(invertColor, 0.0, 1.0);

    // Apply the mask so only selected channels are inverted
    vec3 targeted = mix(source.rgb, inverted, mask);

    // Apply strength as a blend between original and the targeted inversion
    vec3 result = mix(source.rgb, targeted, normalizedStrength);
    
    // Preserve alpha channel
    fragColor = vec4(result, source.a);
}
