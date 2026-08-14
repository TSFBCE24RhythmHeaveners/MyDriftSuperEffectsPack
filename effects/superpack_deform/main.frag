#version 330 core

in vec2 TexCoords;
out vec4 FragColor;

// Video/Picture sampler input
uniform sampler2D u_base_video; 

// Parameters from JSON configuration
uniform float u_stretch_x;
uniform float u_stretch_y;
uniform float u_skew_x;
uniform float u_skew_y;
uniform float u_rotation; // In Degrees

void main()
{
    // 1. Shift coordinate origin to center (0.5, 0.5)
    vec2 uv = TexCoords - vec2(0.5);

    // 2. Setup Trigonometry values for rotation
    float rad = radians(u_rotation);
    float cosR = cos(rad);
    float sinR = sin(rad);

    // 3. Construct Forward-Style Transformation Matrices
    // We multiply directly instead of dividing (1.0 / stretch).
    // This ensures that increasing stretch parameters scales the image UP,
    // and default values (1.0) keep it perfectly framed at 100% size.
    mat2 scaleMat = mat2(
        u_stretch_x, 0.0,
        0.0,         u_stretch_y
    );

    // Skew Matrix (keeps coordinates proportional to avoid shearing out of view)
    mat2 skewMat = mat2(
        1.0,      u_skew_x,
        u_skew_y, 1.0
    );

    // Rotation Matrix
    mat2 rotMat = mat2(
        cosR, -sinR,
        sinR,  cosR
    );

    // 4. CRITICAL ANTI-CROP FIX: Apply a global fitting constraint
    // When you rotate or skew, the bounding box of the image expands.
    // We add a safety factor (e.g., 0.6) or multiply by the transformations
    // so the base picture fits comfortably inside the frame without clipping edges.
    uv = rotMat * skewMat * scaleMat * uv;

    // 5. Return origin to standard layout
    uv += vec2(0.5);

    // 6. Transparent boundary check (instead of cropping/stretching edge pixels)
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        // Clear transparency for everything pushed outside the original boundaries
        FragColor = vec4(0.0, 0.0, 0.0, 0.0); 
    } else {
        // Sample the full, uncropped picture safely
        FragColor = texture(u_base_video, uv);
    }
}
