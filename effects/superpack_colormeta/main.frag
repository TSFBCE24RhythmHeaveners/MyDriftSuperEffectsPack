#version 330 core

// Drift reserved inputs
uniform sampler2D u_currentTexture;
uniform vec2 u_resolution; // available but not required
in vec2 v_texCoord;
out vec4 fragColor;

// User-facing parameters (bound by effect.json identifiers)
uniform float brightness;   // additive: -1..1 (0 = no change)
uniform float gamma;        // gamma: >0 (1 = no change)
uniform float exposure;     // EV adjustment: -2..2 (0 = no change)
uniform float contrast;     // contrast multiplier: 0..2 (1 = no change)
uniform float saturation;   // 0..2 (1 = no change)
uniform float temperature;  // -1..1 (negative=cool, positive=warm)
uniform float greenmagenta;    // -1..1 (negative=green, positive=pink)
uniform float hue;          // degrees, -180..180 (0 = no change)

// Helpers
const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

// Rotate hue in YIQ-like space (cheap & stable)
// Original matrices (kept for numeric stability of the yi/q conversion)
mat3 rgb2yiq = mat3(
    0.299,  0.587,  0.114,
    0.596, -0.274, -0.322,
    0.211, -0.523,  0.312
);
mat3 yiq2rgb = mat3(
    1.0,  0.956,  0.621,
    1.0, -0.272, -0.647,
    1.0, -1.106,  1.703
);

// Improved hue rotation that:
//  - reduces rotation for near-neutral (low-chroma) pixels so whites/grays stay neutral,
//  - preserves the original perceived luminance (LUMA) exactly by adding a neutral offset after rotation.
vec3 rotateHuePreserveLum(vec3 color, float angleRad) {
    // original luminance (perceptual)
    float origLum = dot(color, LUMA);

    // compute chroma (color deviation from gray) and its magnitude
    vec3 chroma = color - vec3(origLum);
    float chromaMag = length(chroma);

    // weight rotation by chroma magnitude to avoid coloring near-neutral pixels.
    // tweak the thresholds to taste: below minThresh -> no rotation; above maxThresh -> full rotation
    const float minThresh = 0.01; // essentially neutral
    const float maxThresh = 0.20; // fully saturated-ish
    float rotWeight = clamp((chromaMag - minThresh) / (maxThresh - minThresh), 0.0, 1.0);
    // optionally smooth the transition
    rotWeight = smoothstep(0.0, 1.0, rotWeight);

    float ang = angleRad * rotWeight;

    // perform the YIQ chroma rotation (only rotates the I/Q components)
    vec3 yiq = rgb2yiq * color;
    float cs = cos(ang);
    float sn = sin(ang);
    mat2 rot = mat2(cs, -sn, sn, cs);
    yiq.yz = rot * yiq.yz;
    vec3 rotated = yiq2rgb * yiq;

    // Correct any small luminance drift by restoring original luminance.
    // Compute rotated luminance and add a neutral offset so dot(final, LUMA) == origLum.
    float rotatedLum = dot(rotated, LUMA);
    rotated += vec3(origLum - rotatedLum);

    return clamp(rotated, 0.0, 1.0);
}

// Temperature tweak: subtle RGB shift toward warm/cool
vec3 applyTemperature(vec3 c, float t) {
    // t in [-1,1], push red up and blue down for warm, opposite for cool
    // coefficients chosen for pleasing results without clipping
    float rShift = clamp(t * 0.1, -0.15, 0.15);
    float bShift = clamp(-t * 0.08, -0.12, 0.12);
    c.r = clamp(c.r + rShift, 0.0, 1.0);
    c.b = clamp(c.b + bShift, 0.0, 1.0);
    return c;
}

// Green-Magenta tint: shift cyan/magenta channel
vec3 applyGreenMagenta(vec3 c, float gp) {
    // gp in [-1,1]: negative pushes toward green, positive toward pink/magenta
    // This is a simple channel push: reduce green for pink, reduce magenta for green
    float gpShift = clamp(gp * 0.15, -0.2, 0.2);
    c.g = clamp(c.g - gpShift, 0.0, 1.0);           // green channel
    c.r = clamp(c.r + gpShift * 0.8, 0.0, 1.0);    // boost red for pink
    c.b = clamp(c.b + gpShift * 0.5, 0.0, 1.0);    // slight blue boost
    return c;
}

// Exposure: multiplicative brightness in linear space
vec3 applyExposure(vec3 c, float exp) {
    // exp in [-2,2], each stop = 2x brightness change
    // Formula: output = input * 2^exposure
    return c * pow(2.0, exp);
}

void main() {
    // Sample the source exactly at the provided texture coordinates.
    // Do NOT manipulate v_texCoord (avoid zoom / pixelization bugs).
    vec4 src = texture(u_currentTexture, v_texCoord);

    // quick guard against degenerate gamma:
    float g = max(gamma, 0.0001);

    vec3 col = src.rgb;

    // Exposure: early multiplicative adjustment (affects subsequent steps)
    col = applyExposure(col, exposure);

    // Brightness: simple additive offset (safe)
    col += brightness;

    // Contrast: scale about 0.5 (neutral mid point)
    // contrast = 1.0 -> unchanged; <1 reduces contrast; >1 increases
    col = (col - 0.5) * contrast + 0.5;

    // Saturation: interpolate between luminance and color
    float lum = dot(col, LUMA);
    col = mix(vec3(lum), col, saturation);

    // Temperature: gentle RGB bias
    col = applyTemperature(col, temperature);

    // Green-Pink tint: cyan/magenta shift
    col = applyGreenMagenta(col, greenmagenta);

    // Hue: rotate chroma in YIQ-like space, preserving luminance and avoiding tinting near-neutral pixels
    float angle = radians(hue);
    col = rotateHuePreserveLum(col, angle);

    // Gamma: final nonlinear stretch (affects midtones)
    col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / g));

    // Ensure final color remains in valid range
    col = clamp(col, 0.0, 1.0);

    fragColor = vec4(col, src.a);
}
