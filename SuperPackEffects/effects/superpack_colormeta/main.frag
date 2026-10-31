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

vec3 rotateHue(vec3 color, float angleRad) {
    vec3 yiq = rgb2yiq * color;
    float cs = cos(angleRad);
    float sn = sin(angleRad);
    mat2 rot = mat2(cs, -sn, sn, cs);
    vec2 iq = rot * yiq.yz;
    yiq.yz = iq;
    return yiq2rgb * yiq;
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

    // Hue: rotate chroma in YIQ-like space
    float angle = radians(hue);
    col = rotateHue(col, angle);

    // Gamma: final nonlinear stretch (affects midtones)
    col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / g));

    // Ensure final color remains in valid range
    col = clamp(col, 0.0, 1.0);

    fragColor = vec4(col, src.a);
}
