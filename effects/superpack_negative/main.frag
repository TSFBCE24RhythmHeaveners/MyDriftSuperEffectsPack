#version 330 core
in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_currentTexture;
uniform float strength;
uniform vec3 invertColor; // per-channel mask: 1 = invert that channel, 0 = leave it
                         // Accepts either 0.0-1.0 range OR 0-255 (hex style) per component

void main() {
    vec4 source = texture(u_currentTexture, v_texCoord);

    // Normalize strength: support both 0.0-1.0 and 0-100 ranges
    float normalizedStrength = strength;
    if (normalizedStrength > 1.5) {
        // assume user supplied 0-100
        normalizedStrength = normalizedStrength / 100.0;
    }
    normalizedStrength = clamp(normalizedStrength, 0.0, 1.0);

    // Normalize invertColor: support both 0.0-1.0 and 0-255 styles
    vec3 normInvertColor = invertColor;
    if (any(greaterThan(normInvertColor, vec3(1.5)))) {
        normInvertColor = normInvertColor / 255.0;
    }
    normInvertColor = clamp(normInvertColor, 0.0, 1.0);

    // Invert the RGB channels
    vec3 inverted = vec3(1.0) - source.rgb;

    // Use normInvertColor as a per-channel mask so only selected channels are inverted.
    // e.g. normInvertColor = vec3(1.0, 0.0, 0.0) -> invert red only
    vec3 mask = normInvertColor;
    vec3 targeted = mix(source.rgb, inverted, mask);

    // Apply overall strength between original and targeted inversion
    vec3 result = mix(source.rgb, targeted, normalizedStrength);

    fragColor = vec4(result, source.a);
}
