// DO NOT ADD A #VERSION TAG HERE. Qt's qsb compiler handles versioning injections automatically.

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;

// MANDATORY QT 6 UNIFORM MEMORY ALIGNMENT
layout(std140, binding = 0) uniform buf {
    // Occupies bytes 0 to 63 (4x4 matrix = 16 floats * 4 bytes = 64 bytes)
    mat4 qt_Matrix;
    
    // Occupies bytes 64 to 67
    float qt_Opacity;
    
    // CRITICAL MEMORY ALIGNMENT FOR QT 6: 
    // We add 3 floats of empty space to round out the 16-byte memory boundary (std140 rule).
    // Without this, the upcoming custom parameters sit in misaligned registers and read as 0.
    float padding_a;
    float padding_b;
    float padding_c;

    // Custom Uniform Parameters mapped from CutWire Drift
    float u_stretch_x;
    float u_stretch_y;
    float u_skew_x;
    float u_skew_y;
    float u_rotation;
    float u_flip_h; // 0.0 = false, 1.0 = true
    float u_flip_v; // 0.0 = false, 1.0 = true
};

// The source texture image map bound safely to the engine pipeline slot
layout(binding = 1) uniform sampler2D u_base_video;

void main()
{
    // 1. Shift texture coordinate origin to center (0.5, 0.5)
    vec2 uv = qt_TexCoord0 - vec2(0.5);

    // 2. APPLY FLIPS: Process floats as booleans (value > 0.5 means flag is checked)
    if (u_flip_h > 0.5) uv.x = -uv.x;
    if (u_flip_v > 0.5) uv.y = -uv.y;

    // 3. ZERO PROTECTION: If sliders read zero due to initializing, use 1.0 baseline scale
    float sX = (u_stretch_x == 0.0) ? 1.0 : u_stretch_x;
    float sY = (u_stretch_y == 0.0) ? 1.0 : u_stretch_y;

    // 4. MANUAL SKEW & SCALE (Prevents matrix collapse into giant pixels)
    vec2 transformed_uv;
    transformed_uv.x = (uv.x + (uv.y * u_skew_x)) / sX;
    transformed_uv.y = (uv.y + (uv.x * u_skew_y)) / sY;

    // 5. MANUAL ROTATION (Prevents clipping/cropping)
    float rad = radians(u_rotation);
    float cosR = cos(rad);
    float sinR = sin(rad);

    vec2 final_uv;
    final_uv.x = transformed_uv.x * cosR - transformed_uv.y * sinR;
    final_uv.y = transformed_uv.x * sinR + transformed_uv.y * cosR;

    // 6. Return origin to standard coordinate grid
    final_uv += vec2(0.5);

    // 7. ANTI-CROP / ANTI-STRETCH BOUNDARY GATE
    if (final_uv.x < 0.0 || final_uv.x > 1.0 || final_uv.y < 0.0 || final_uv.y > 1.0) {
        // Output zero alpha transparency outside boundaries instead of pixel lines or blocks
        fragColor = vec4(0.0, 0.0, 0.0, 0.0); 
    } else {
        // Render transformed picture while matching Qt's native parent layer opacity 
        fragColor = texture(u_base_video, final_uv) * qt_Opacity;
    }
}
