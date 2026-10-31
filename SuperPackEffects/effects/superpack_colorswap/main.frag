#version 330 core
// Drift-provided inputs:
//   v_texCoord, sampler2D u_currentTexture, u_resolution, u_time, ...
//
// Bound uniforms (from effect.json parameters / fixedParams):
//   vec3 u_baseColor      // color param: "#rrggbb" normalized to vec3(0..1)
//   vec3 u_targetColor    // color param: "#rrggbb" normalized to vec3(0..1)
//   float u_threshold     // 0..1 (when using Lab, interpreted as DeltaE/100)
//   float u_softness      // 0..1
//   float u_useLab        // 0 = linear-RGB distance, 1 = Lab DeltaE
//   float u_showMask      // 0 = normal output, 1 = show match mask (debug)
// Note: parameter ids in effect.json must be the identifiers the engine expects;
// they are exposed to the engine and bound as uniforms prefixed with "u_".

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_currentTexture;

uniform vec3 u_baseColor;
uniform vec3 u_targetColor;
uniform float u_threshold;
uniform float u_softness;
uniform float u_useLab;
uniform float u_showMask;

// sRGB <-> linear (simple gamma approx)
vec3 srgbToLinear(vec3 c) { return pow(clamp(c, 0.0, 1.0), vec3(2.2)); }
vec3 linearToSrgb(vec3 c) { return pow(max(c, vec3(0.0)), vec3(1.0 / 2.2)); }

// Linear RGB -> XYZ (D65)
vec3 linearRGBToXYZ(vec3 r) {
    const mat3 M = mat3(
        0.4124564, 0.3575761, 0.1804375,
        0.2126729, 0.7151522, 0.0721750,
        0.0193339, 0.1191920, 0.9503041
    );
    return M * r;
}

// XYZ -> Lab (D65)
vec3 xyzToLab(vec3 xyz) {
    const vec3 white = vec3(0.95047, 1.00000, 1.08883);
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
    float srcA = src.a;

    // defensive clamps
    float threshold = max(u_threshold, 0.0);
    float softness  = max(u_softness, 0.0);

    // compute perceptual distance normalized to 0..1
    float d_norm;
    if (u_useLab > 0.5) {
        // Lab DeltaE roughly 0..100; normalize by 100 so threshold remains 0..1
        float deltaE = distance(rgbToLab(src.rgb), rgbToLab(u_baseColor));
        d_norm = clamp(deltaE / 100.0, 0.0, 1.0);
    } else {
        // linear RGB Euclidean, normalized by sqrt(3)
        float d = distance(srgbToLinear(src.rgb), srgbToLinear(u_baseColor));
        d_norm = clamp(d / 1.7320508, 0.0, 1.0);
    }

    float halfSoft = 0.5 * softness;
    float edge0 = max(0.0, threshold - halfSoft);
    float edge1 = min(1.0, threshold + halfSoft);

    float s;
    if (edge1 > edge0)
        s = smoothstep(edge0, edge1, d_norm); // 0 when close, 1 when far
    else
        s = step(edge0, d_norm);

    float match = 1.0 - s; // 1 = replace, 0 = unchanged

    // debug: show mask if requested (grayscale)
    if (u_showMask > 0.5) {
        fragColor = vec4(vec3(match), srcA);
        return;
    }

    // no-op early-out if base == target (common cause of "no change")
    if (distance(u_baseColor, u_targetColor) < 1e-6) {
        fragColor = src;
        return;
    }

    // mix in linear space for correct interpolation
    vec3 outLin = mix(srgbToLinear(src.rgb), srgbToLinear(u_targetColor), match);
    vec3 outSRGB = linearToSrgb(outLin);

    fragColor = vec4(outSRGB, srcA);
}
