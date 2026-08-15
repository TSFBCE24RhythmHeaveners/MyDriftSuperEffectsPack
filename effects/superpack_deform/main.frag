#version 330 core

in vec2 v_texCoord; // Injected uniform or pass-through texture coordinates from Drift vertex stage
out vec4 FragColor;

// CutWire Drift global textures and dimensions
uniform sampler2D u_inputTexture; 
uniform vec2 u_resolution; 

// Sliders and toggles parsed directly from deform.json
uniform float u_zoom;
uniform float u_stretch_x;
uniform float u_stretch_y;
uniform float u_rotate;
uniform float u_skew_x;
uniform float u_skew_y;
uniform bool u_flip_h;
uniform bool u_flip_v;
uniform bool u_edge_wrap;

void main() {
    // 1. Normalize aspect ratio to correct skewed proportions during rotations
    float aspect = u_resolution.x / u_resolution.y;
    
    // 2. Center coordinates around (0.0, 0.0) to prevent the "zoomed-in base image bug"
    vec2 uv = v_texCoord - vec2(0.5);

    // 3. Apply horizontal and vertical flip operations
    if (u_flip_h) uv.x *= -1.0;
    if (u_flip_v) uv.y *= -1.0;

    // 4. Adjust for canvas aspect ratio before rotation or skewing
    uv.x *= aspect;

    // 5. Build and process the Skew transform matrix
    uv = mat2(
        1.0,       u_skew_x,
        u_skew_y,  1.0
    ) * uv;

    // 6. Build and process the Rotation matrix (Converted degrees to radians)
    float rad = radians(u_rotate);
    float cosA = cos(rad);
    float sinA = sin(rad);
    uv = mat2(
        cosA, -sinA,
        sinA,  cosA
    ) * uv;

    // 7. Revert aspect ratio scaling adjustments
    uv.x /= aspect;

    // 8. Scale transformations (Zoom and independent X/Y Stretch sliders)
    vec2 scale = vec2(u_stretch_x, u_stretch_y) * u_zoom;
    uv /= scale;

    // 9. Reposition coordinates back into the original texture canvas space [0.0, 1.0]
    uv += vec2(0.5);

    // 10. Handle Boundary Conditions
    if (u_edge_wrap) {
        // Fract forces coordinates to wrap perfectly between 0.0 and 1.0 (Tiling)
        // This solves the giant pixel bug by avoiding clamping hardware states entirely
        uv = fract(uv);
        FragColor = texture(u_inputTexture, uv);
    } else {
        // Standard safe-border fallback when tiling is off
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
            FragColor = vec4(0.0, 0.0, 0.0, 0.0); // Transparent border
        } else {
            FragColor = texture(u_inputTexture, uv);
        }
    }
}
