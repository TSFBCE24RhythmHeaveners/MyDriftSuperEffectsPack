// NO #VERSION HEADER. The Qt 6 qsb compiler injects this automatically.

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;

// FIXED QT 6 UNIFORM BLOCK (Keeps your exact original parameter names)
layout(std140, binding = 0) uniform buf {
    // Occupies Bytes 0 to 63
    mat4 qt_Matrix;
    
    // Occupies Bytes 64 to 79 (4 bytes for float + 12 bytes padding)
    float qt_Opacity;
    float _pad0[3]; 
    
    // Occupies Bytes 80 to 95
    float u_stretch_x;
    float _pad1[3];
    
    // Occupies Bytes 96 to 111
    float u_stretch_y;
    float _pad2[3];
    
    // Occupies Bytes 112 to 127
    float u_skew_x;
    float _pad3[3];
    
    // Occupies Bytes 128 to 143
    float u_skew_y;
    float _pad4[3];
    
    // Occupies Bytes 144 to 159
    float u_rotation;
    float _pad5[3];
    
    // Occupies Bytes 160 to 175 (Booleans must be passed as floats: 0.0 or 1.0)
    float u_flip_h;
    float _pad6[3];
    
    // Occupies Bytes 176 to 191
    float u_flip_v;
    float _pad7[3];
};

// Texture sampler safely bound to pipeline slot 1
layout(binding = 1) uniform sampler2D u_base_video;

void main()
{
    // 1. Shift texture coordinate origin to dead center
    vec2 uv = qt_TexCoord0 - vec2(0.5);

    // 2. APPLY FLIPS: Checks if the float acting as a boolean toggle is enabled (> 0.5)
    if (u_flip_h > 0.5) uv.x = -uv.x;
    if (u_flip_v > 0.5) uv.y = -uv.y;

    // 3. ZERO PROTECTION: If values are uninitialized or slider is at zero, default to 1.0 scale
    // This completely prevents the "oversized pixel" artifact.
    float sX = (u_stretch_x == 0.0) ? 1.0 : u_stretch_x;
    float sY = (u_stretch_y == 0.0) ? 1.0 : u_stretch_y;

    // 4. MANUAL SKEW & SCALE (Bypasses matrix flattening bugs)
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

    // 6. Return origin to standard bottom-left framework layout
    final_uv += vec2(0.5);

    // 7. ANTI-CROP & ANTI-STRETCH BOUNDARY GATE
    if (final_uv.x < 0.0 || final_uv.x > 1.0 || final_uv.y < 0.0 || final_uv.y > 1.0) {
        // Keeps empty outer boundary space transparent instead of creating stretched color bars
        fragColor = vec4(0.0, 0.0, 0.0, 0.0); 
    } else {
        // Output clean transformed texture while matching Qt's native parent layer opacity
        fragColor = texture(u_base_video, final_uv) * qt_Opacity;
    }
}
