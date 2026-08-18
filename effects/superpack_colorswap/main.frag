#version 330 core
// Drift expects: u_currentTexture, u_resolution, etc.
// Parameters from effect.json should bind to uniforms named below:
//   baseColor (color) -> uniform vec3 u_baseColor (sRGB, 0..1)
//   targetColor (color) -> uniform vec3 u_targetColor (sRGB, 0..1)
//   threshold (float) -> uniform float u_threshold (0..1)
//   softness (float) -> uniform float u_softness (0..1)

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_currentTexture;
uniform vec3 u_baseColor;    // #rrggbb as vec3(0..1)
uniform vec3 u_targetColor;  // #rrggbb as vec3(0..1)
uniform float u_threshold;   // distance at which color is considered matching (0..~1)
uniform float u_softness;    // width of transition (0 -> hard edge)

//
// Helpers: sRGB <-> linear (approx)
vec3 srgbToLinear(vec3 c) {
    // approximate gamma -> linear
    return pow(c, vec3(2.2));
}
vec3 linearToSrgb(vec3 c) {
    return pow(max(c, vec3(0.0)), vec3(1.0 / 2.2));
}

void main() {
    // Sample with normalized UVs to avoid oversized pixel / zoom issues.
    // Use the engine-provided v_texCoord and sampler2D u_currentTexture.
    vec4 src = texture(u_currentTexture, v_texCoord);

    // Preserve alpha
    float srcA = src.a;

    // Work in linear space for better perceptual distance
    vec3 srcLinear    = srgbToLinear(src.rgb);
    vec3 baseLinear   = srgbToLinear(u_baseColor);
    vec3 targetLinear = srgbToLinear(u_targetColor);

    // Clamp inputs to safe ranges
    float threshold = max(u_threshold, 0.0);
    float softness  = max(u_softness, 0.0);

    // Euclidean distance in linear RGB
    float d = distance(srcLinear, baseLinear);

    // Build smooth transition region: match==1 where distance is small (close to base)
    float halfSoft = 0.5 * softness;
    float edge0 = max(0.0, threshold - halfSoft);
    float edge1 = threshold + halfSoft;

    float s = 0.0;
    if (edge1 > edge0) {
        s = smoothstep(edge0, edge1, d); // 0 when close, 1 when far
    } else {
        // No softness -> hard threshold
        s = step(threshold, d);
    }
    float match = 1.0 - s; // 1 when we should fully replace, 0 when untouched

    // Mix in linear space, then convert back to sRGB
    vec3 outLinear = mix(srcLinear, targetLinear, match);
    vec3 outSRGB = linearToSrgb(outLinear);

    fragColor = vec4(outSRGB, srcA);
}
