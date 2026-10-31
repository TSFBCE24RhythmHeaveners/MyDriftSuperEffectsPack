#version 330 core
// TV / analog glitch simulation for CutWire Drift
// Uniforms expected from Drift:
//  sampler2D u_currentTexture
//  vec2 u_resolution
//  float u_time
//  float u_frameIndex
// Parameters (bind these from effect.json):
//  float lineSync            // 0..20 (pixels max horizontal shift)
//  float lineSyncSize        // 0..10 (pixels per sync group) - 0 disables grouping
//  float verticalSync        // -10..10 (vertical offset amplitude in pixels)
//  float scanlines           // 0..1 (black blurred scanlines opacity)
//  float scanPhasing         // 0..1 (white moving line opacity)
//  float scanPhasingSize     // 0..1 (white line size factor [0..1])
//  float noise               // 0..1 (random pixel noise opacity)
//  float anaglyphSlide       // 0..1 (anaglyph channel slide)
uniform sampler2D u_currentTexture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_frameIndex;

uniform float lineSync;
uniform float lineSyncSize;
uniform float verticalSync;
uniform float scanlines;
uniform float scanPhasing;
uniform float scanPhasingSize;
uniform float noise;
uniform float anaglyphSlide;

// Helpers
float hash1(float x) {
    // cheap 1D hash [0,1)
    return fract(sin(x) * 43758.5453123);
}
float hash2(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// Convert pixel shift to UV space
vec2 pxToUV(vec2 px) {
    return px / u_resolution;
}

void main() {
    // Compute UV from fragment coordinates, flipping Y so uv.y==0 is top
    vec2 frag = gl_FragCoord.xy;
    vec2 uv = vec2(frag.x / u_resolution.x, 1.0 - frag.y / u_resolution.y);

    // ---- Vertical sync: moving vertical offset in pixels (animated by time) ----
    // verticalSync is an amplitude in pixels; animate smoothly with sin()
    float vAmp = verticalSync;
    float vAnim = 0.0;
    if (abs(vAmp) > 0.0001) {
        // speed derived from subtle frame index / time so it moves but not too fast
        float speed = 0.25 + fract(hash1(floor(u_frameIndex * 0.01))) * 0.5;
        vAnim = sin(u_time * speed * 2.0 + hash1(uv.x * 12.9898) * 6.2831) * vAmp;
    }
    uv.y += pxToUV(vec2(0.0, vAnim)).y;

    // ---- Line sync (horizontal column shifts) ----
    // lineSync: max shift in pixels
    // lineSyncSize: group width in pixels. If <= 0 -> treat per-column.
    float maxShiftPx = max(0.0, lineSync);
    float groupSizePx = max(1.0, lineSyncSize); // avoid division by zero
    // Group index in pixel units (use frag.x, not uv.x, to keep integer pixel groups)
    float groupIndex = floor(frag.x / groupSizePx);

    // Generate a pseudo-random shift for this group. Use a slow-changing time quantisation
    // so groups change occasionally rather than every frame.
    float changePeriod = 0.5; // seconds per reseed (tweakable, deterministic enough)
    float reseed = floor(u_time / changePeriod);
    float rnd = hash1(groupIndex + reseed * 43758.0);
    // Convert rnd to [-1,1] and scale by maxShiftPx
    float shiftPx = (rnd * 2.0 - 1.0) * maxShiftPx;

    // Subpixel horizontal shift (keeps interpolation; avoids "big pixel" artifact)
    uv.x += pxToUV(vec2(shiftPx, 0.0)).x;

    // Clamp UV to avoid sampling outside the texture (prevents wrap/zoom artifacts)
    uv = clamp(uv, vec2(0.0), vec2(1.0));

    // ---- Base sample(s) ----
    // Anaglyph channel slide: sample color channels offset horizontally
    // anaglyphSlide in 0..1 maps to a small pixel offset; we pick up to 8 pixels of shift at max
    float anagPx = anaglyphSlide * 8.0;
    vec3 color;
    if (anagPx > 0.001) {
        // red shifted left, green and blue shifted right
        vec2 uvR = uv + pxToUV(vec2(-anagPx, 0.0));
        vec2 uvGB = uv + pxToUV(vec2(anagPx * 0.5, 0.0)); // slightly smaller for GB
        uvR = clamp(uvR, 0.0, 1.0);
        uvGB = clamp(uvGB, 0.0, 1.0);
        vec3 cR = texture(u_currentTexture, uvR).rgb;
        vec3 cGB = texture(u_currentTexture, uvGB).rgb;
        color = vec3(cR.r, cGB.g, cGB.b);
    } else {*
