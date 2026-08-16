#version 330 core

// Input texture coordinates forwarded by CutWire Drift's compositor
in vec2 TexCoords;

// Output to the screen
out vec4 FragColor;

// CutWire Drift Standard Texture binding for the source clip
uniform sampler2D u_Texture;

// ─── USER CONTROLS (JSON Map Targets) ──────────────────────────────
uniform float u_brightness;   // Default: 0.0 (Range: -1.0 to 1.0)
uniform float u_contrast;     // Default: 1.0 (Range:  0.0 to 2.0)
uniform float u_saturation;   // Default: 1.0 (Range:  0.0 to 2.0)
uniform float u_hue;          // Default: 0.0 (Range: -180.0 to 180.0)
uniform float u_temperature;  // Default: 0.0 (Range: -1.0 to 1.0)
uniform float u_tint;         // Default: 0.0 (Range: -1.0 to 1.0)

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
    // 1. Safe Sampling: Prevents Offset Zooming/Oversized Pixel Bugs
    vec4 texColor = texture(u_Texture, TexCoords);
    vec3 color = texColor.rgb;

    // 2. Brightness (Additive offset)
    color += u_brightness;

    // 3. Contrast (Scale around the 0.5 midtone gray point)
    color = (color - 0.5) * u_contrast + 0.5;

    // 4. Saturation (Linear interpolation with grayscale luminance)
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luma), color, u_saturation);

    // 5. Hue Rotation (Convert to HSV, shift Hue in degrees, convert back)
    vec3 hsv = rgb2hsv(color);
    hsv.x += (u_hue / 360.0); 
    hsv.x = fract(hsv.x); // Wraps angles cleanly between 0.0 and 1.0
    color = hsv2rgb(hsv);

    // 6. Temperature & Tint (Photo-accurate Kelvin balance vector)
    // Temperature shifts between Blue (-1.0) and Amber/Yellow (1.0)
    // Tint shifts between Green (-1.0) and Magenta (1.0)
    vec3 warmCool = vec3(0.15, 0.0, -0.15) * u_temperature;
    vec3 greenMagenta = vec3(-0.10, 0.15, -0.10) * u_tint;
    color += warmCool + greenMagenta;

    // 7. Clamp and Output (Preserves original clip alpha to prevent alpha slates)
    FragColor = vec4(clamp(color, 0.0, 1.0), texColor.a);
}
