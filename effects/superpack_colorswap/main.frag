#version 330 core
// Drift: v_texCoord, u_currentTexture, u_resolution, etc. are provided by the host.
// Parameter uniforms (from effect.json) expected here:
//
//   uniform vec3 u_baseColor;    // color parameter #rrggbb as vec3 (0..1) - sRGB
//   uniform vec3 u_targetColor;  // color parameter #rrggbb as vec3 (0..1) - sRGB
//   uniform float u_threshold;   // 0..1 (mapped to perceptual DeltaE by *100 internally)
//   uniform float u_softness;    // 0..1 transition width (normalized)
//   uniform float u_useLab;      // 0.0 = use linear-RGB distance, >0.5 = use Lab DeltaE
//   uniform float u_showMask;    // 0.0 show normal result; 1.0 output mask for debugging
//
// Notes:
// - When u_useLab > 0.5: threshold is interpreted as DeltaE/100 (so threshold=0.07 ≈ DeltaE 7).
// - If you see "no change", enable u_showMask to visualize the matched pixels.

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_currentTexture;

uniform vec3 u_baseColor;
uniform vec3 u_targetColor;
uniform float u_threshold;
uniform float u_softness;
uniform float u_useLab;
uniform float u_showMask;

// sRGB <-> linear approximations
vec3 srgbToLinear(vec3 c) { return pow(clamp(c, 0.0, 1.0), vec3(2.2)); }
vec3 linearToSrgb(vec3 c) { return pow(max(c, vec3(0.0)), vec3(1.0 / 2.2)); }

// RGB linear -> XYZ (D65)
vec3 linearRGBToXYZ(vec3 r) {
    const mat3 M = mat3(
        0.4124564, 0.3575761, 0.1804375,
        0.2126729, 0.7151522, 0.0721750,
        0.0193339, 0.1191920, 0.9503041
    );
    return M * r;
}

// XYZ -> Lab (D65 reference)
vec3 xyzToLab(vec3 xyz) {
    const vec3 white = vec3(0.95047, 1.00000, 1.08883); // D65
    vec3 v = xyz / white;
    vec3 f;
    for (int i = 0; i < 3; ++i) {
        float t = v[i];
        f[i] = t > 0.008856 ? pow(t, 1.0/3.0) : (7.787 * t + 16.0/116.0);
    }
    float L = 116.0 * f.y - 16.0;
    float a = 500.0 * (f.x - f.y);
    float b = 200.0 * (f.y - f.z);
    return vec3(L, a, b);
}

vec3 rgbToLab(vec3 srgb) {
    vec3 lin = srgbToLinear(srgb);
    vec3 xyz = linearRGBToXYZ(lin);
    return xyzToLab(xyz);
}

void main() {
    vec4 src = texture(u_currentTexture, v_texCoord);
    float srcA =*
