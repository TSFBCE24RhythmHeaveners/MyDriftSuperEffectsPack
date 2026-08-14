// DO NOT ADD A #VERSION TAG HERE. Qt 6's qsb compiler injects it automatically.

// 1. Declare the input texture coordinates passed from Qt's vertex shader
layout(location = 0) in vec2 qt_TexCoord0;

// 2. Declare the final pixel output location
layout(location = 0) out vec4 fragColor;

// 3. MANDATORY QT 6 UNIFORM BLOCK (std140 binding layout)
// Qt 6 groups all custom properties and built-ins inside a unified struct container.
layout(std140, binding = 0) uniform buf {
    mat4 qt_Matrix;
    float qt_Opacity;
    
    // Your UI parameters from the CutWire Drift JSON mapping
    float u_stretch_x;
    float u_stretch_y;
    float u_skew_x;
    float u_skew_y;
    float u_rotation;
    
    // Booleans inside Qt 6 uniform blocks must be treated as floats (0.0 = false, 1.0 = true)
    float u_flip_h;
    float u_flip_v;
};

// Define the source texture sampler linked from your QML layer
layout(binding = 1) uniform sampler2D u_base_video;

void main()
{
    // 4. Shift coordinate origin to center (0.5, 0.5)
    vec2 uv = qt_TexCoord0 - vec2(0.5);

    // 5. APPLY FLIPS: Safely evaluates float values acting as booleans (value > 0.5)
    if (u_flip_h > 0.5) uv.x = -uv.x;
    if (u_flip_v > 0.5) uv.y = -uv.y;

    // 6. ZERO PROTECTION: Eliminates the giant blown-up pixel bug if values are 0
    float sX = (u_stretch_x == 0.0) ? 1.0 : u_stretch_x;
    float sY = (u_stretch_y == 0.0) ? 1.0 : u_stretch_y;

    // 7. MANUAL SKEW & SCALE (Prevents matrix flattening collapses)
    vec2 transformed_uv;
    transformed_uv.x = (uv.x + (uv.y * u_skew_x)) / sX;
    transformed_uv.y = (uv.y + (uv.x * u_skew_y)) / sY;

    // 8. MANUAL ROTATION (Trigonometric separation)
    float rad = radians(u_rotation);
    float cosR = cos(rad);
    float sinR = sin(rad);

    vec2 final_uv;
    final_uv.x = transformed_uv.x * cosR - transformed_uv.y * sinR;
    final_uv.y = transformed_uv.x * sinR + transformed_uv.y * cosR;

    // 9. Return coordinate framework to standard layout
    final_uv += vec2(0.5);

    // 10. ANTI-CROP & ANTI-STRETCH BOUNDARY GATE
    // If transformations push coordinates out of visual bounds, output pure transparency
    if (final_uv.x < 0.0 || final_uv.x > 1.0 || final_uv.y < 0.0 || final_uv.y > 1.0) {
        fragColor = vec4(0.0, 0.0, 0.0, 0.0); 
    } else {
        // Sample texture and respect Qt's native parent layer opacity control
        fragColor = texture(u_base_video, final_uv) * qt_Opacity;
    }
}
