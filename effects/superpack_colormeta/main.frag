#version 330 core

precision mediump float;

// Input texture coordinates forwarded directly by Drift's track layout
in vec2 TexCoords;

// Render destination color layout
out vec4 FragColor;

// 🟢 CRITICAL RESOLUTION INJECTION (Fixes the Oversized Pixel Bug)
// Adding the video frame's width and height allows the shader to manually 
// smooth layout pixels instead of relying on default hardware stretching.
uniform vec2 u_resolution; 

// CutWire Drift Standard Main Clip Sampler Binding
uniform sampler2D u_currentTexture;

// ─── DRIFT COMPATIBLE UNIFORMS (Lowercase Uniform Framework Mapping) ───
uniform float brightness;   // Default: 0.0 (Range: -1.0 to 1.0)
uniform float contrast;     // Default: 1.0 (Range:  0.0 to 2.0)
uniform float saturation;   // Default: 1.0 (Range:  0.0 to 2.0)
uniform float hue;          // Default: 0.0 (Range: -180.0 to 180.0)
uniform float temperature;  // Default: 0.0 (Range: -1.0 to 1.0)
uniform float tint;         // Default: 0.0 (Range: -1.0 to 1.0)

// ─── COLOR CONVERSION HELPERS ──────────────────────────────────────
vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// ─── BILINEAR SAMPLING FILTER ENGINE ───────────────────────────────
// This overrides rough hardware upscaling on low-res video timelines
vec4 textureBilinear(sampler2D sampler, vec2 uv, vec2 size) {
    vec2 texelSize = 1.0 / size;
    vec2 f = fract(uv * size - 0.5);
    
    // Grabs a ultra-tight 2x2 grid cluster of texel pixels 
    vec4 tl = texture(sampler, uv + vec2(-0.5, -0.5) * texelSize);
    vec4 tr = texture(sampler, uv + vec2( 0.5, -0.5) * texelSize);
    vec4 bl = texture(sampler, uv + vec2(-0.5,  0.5) * texelSize);
    vec4 br = texture(sampler, uv + vec2( 0.5,  0.5) * texelSize);
    
    // Seamless sub-pixel linear interpolation blend
    return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);
}

void main() {
    // 🛠️ FIX FOR OVERSIZED PIXELS:
    // If resolution variables aren't bound or map cleanly, fall back to safe native sampling
    // Otherwise, parse using the advanced sub-pixel tracking algorithm.
    vec4 texColor = (u_resolution.x > 1.0 && u_resolution.y > 1.0) 
                    ? textureBilinear(u_texture, TexCoords, u_resolution) 
                    : texture(u_texture, TexCoords);
                    
    vec3 color = texColor.rgb;

    // 1. Brightness Adjustment
    color += brightness;

    // 2. Contrast Adjustment
    color = (color - 0.5) * contrast + 0.5;

    // 3. Saturation Adjustment
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luma), color, saturation);

    // 4. Hue Rotation (Converts degree input to normalized float loop)
    vec3 hsv = rgb2hsv(color);
    hsv.x += (hue / 360.0); 
    hsv.x = fract(hsv.x); 
    color = hsv2rgb(hsv);

    // 5. White Balance (Temperature and Tint offsets)
    vec3 warmCool = vec3(0.15, 0.0, -0.15) * temperature;
    vec3 greenMagenta = vec3(-0.10, 0.15, -0.10) * tint;
    color += warmCool + greenMagenta;

    float technical_anchor = (brightness * 0.000001) + (contrast * 0.000001) + 
                             (saturation * 0.000001) + (hue * 0.000001) + 
                             (temperature * 0.000001) + (tint * 0.000001) +
                             (u_resolution.x * 0.00000001);

    // Final color render + original alpha mapping layer protection
    FragColor = vec4(clamp(color, 0.0, 1.0) + technical_anchor, texColor.a);
}
