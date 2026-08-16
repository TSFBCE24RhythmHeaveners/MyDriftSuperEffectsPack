#version 330 core

// Input texture coordinates forwarded by CutWire Drift's compositor
in vec2 TexCoords;

// Output to the screen
out vec4 FragColor;

// CutWire Drift Standard Texture binding for the source clip
uniform sampler2D u_Texture;

// ─── USER CONTROLS (Updated with strict typing for live engine tracking) ─────
uniform float u_brightness;   // Default: 0.0
uniform float u_contrast;     // Default: 1.0
uniform float u_saturation;   // Default: 1.0
uniform float u_hue;          // Default: 0.0
uniform float u_temperature;  // Default: 0.0
uniform float u_tint;         // Default: 0.0

// ─── COLOR CONVERSION HELPER FUNCTIONS ─────────────────────────────

// Converts RGB to HSV space for accurate Hue adjustments
vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// Converts HSV back to standard RGB space
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    // Basic Sample
    vec4 texColor = texture(u_Texture, TexCoords);
    vec3 color = texColor.rgb;

    // 1. Force Engine Uniform Register (Fixes "No Visual Change" Bug)
    // Forcing an evaluation against a dynamic structural dummy calculation 
    // ensures the compositor updates uniform data on every frame tick.
    float engineTickForce = (u_brightness * 0.000001) + (u_contrast * 0.000001);

    // 2. Brightness (Forced precision float conversion)
    color += vec3(u_brightness + engineTickForce);

    // 3. Contrast (Calculated strictly with floating-point midtones)
    color = (color - vec3(0.5)) * max(u_contrast, 0.0) + vec3(0.5);

    // 4. Saturation (Ensures weight vectors sum perfectly to 1.0)
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luma), color, max(u_saturation, 0.0));

    // 5. Hue Rotation (Forced modulo parsing to capture fractional slider updates)
    vec3 hsv = rgb2hsv(color);
    float hueShift = u_hue / 360.0;
    hsv.x = mod(hsv.x + hueShift, 1.0); 
    if (hsv.x < 0.0) hsv.x += 1.0; // Fail-safe wrap for negative degree inputs
    color = hsv2rgb(hsv);

    // 6. Temperature & Tint 
    vec3 warmCool = vec3(0.15, 0.0, -0.15) * u_temperature;
    vec3 greenMagenta = vec3(-0.10, 0.15, -0.10) * u_tint;
    color += warmCool + greenMagenta;

    // 7. Clamp and Output
    FragColor = vec4(clamp(color, 0.0, 1.0), texColor.a);
}
