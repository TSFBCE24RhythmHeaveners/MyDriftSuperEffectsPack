#version 330 core

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_currentTexture;
uniform vec3 shadowColor;
uniform vec3 midtoneColor;
uniform vec3 highlightColor;
uniform float strength;
uniform float contrast;
uniform vec2 u_resolution; // available if needed

// Compute perceptual luminance (sRGB luma coefficients)
float luminance(vec3 c) {
    return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

// Contrast adjustment around mid-gray
vec3 adjustContrast(vec3 c, float contrastFactor) {
    // clamp contrast to avoid pathological values
    float cf = clamp(contrastFactor, 0.0, 10.0);
    return clamp((c - 0.5) * cf + 0.5, 0.0, 1.0);
}

void main() {
    // Sample source color using the provided varying texcoord (keeps correct positioning & scale)
    vec4 src = texture(u_currentTexture, v_texCoord);

    // Early pass-through for fully transparent pixels (keeps alpha semantics)
    if (src.a <= 0.0) { fragColor = src; return; }

    // Luminance determines tone position
    float L = luminance(src.rgb);

    // Smoothly blend between shadow -> midtone -> highlight
    // Using two smoothstep bands gives soft transitions.
    float sMid = smoothstep(0.0, 0.5, L);  // goes 0 at dark -> 1 through mids
    float sHigh = smoothstep(0.5, 1.0, L); // goes 0 up to mid -> 1 at highlights

    // First blend shadow->midtone, then blend that -> highlight
    vec3 tri = mix(shadowColor, midtoneColor, sMid);
    tri = mix(tri, highlightColor, sHigh);

    // Mix original color with tritone result by strength (clamped)
    float s = clamp(strength, 0.0, 1.0);
    vec3 mixed = mix(src.rgb, tri, s);

    // Optionally apply contrast to the final color; clamp to displayable range
    mixed = adjustContrast(mixed, contrast);

    fragColor = vec4(mixed, src.a);
}
