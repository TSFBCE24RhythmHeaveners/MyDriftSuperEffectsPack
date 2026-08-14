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

// New Flip Toggles
uniform bool u_flip_h;
uniform bool u_flip_v;

void main()
{
    // 1. Shift coordinate origin to center (0.5, 0.5)
    vec2 uv = TexCoords - vec2(0.5);

    // 2. APPLY FLIPS: If a toggle is true, invert that specific axis
    // This flips the image perfectly across its center line.
    if (u_flip_h) {
        uv.x = -uv.x;
    }
    if (u_flip_v) {
        uv.y = -uv.y;
    }

    // 3. Setup Trigonometry values for rotation
    float rad = radians(u_rotation);
    float cosR = cos(rad);
    float sinR = sin(rad);

    // 4. Construct Forward-Style Transformation Matrices
    mat2 scaleMat = mat2(
        u_stretch_x, 0.0,
        0.0,         u_stretch_y
    );

    mat2 skewMat = mat2(
        1.0,      u_skew_x,
        u_skew_y, 1.0
    );

    mat2 rotMat = mat2(
        cosR, -sinR,
        sinR,  cosR
    );

    // 5. Apply transformations sequentially
    uv = rotMat * skewMat * scaleMat * uv;

    // 6. Return origin to standard bottom-left layout
    uv += vec2(0.5);

    // 7. Transparent boundary check (prevents solid color stretching/cropping)
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        // Keeps empty outer space transparent instead of filling it with edge pixel streaks
        FragColor = vec4(0.0, 0.0, 0.0, 0.0); 
    } else {
        // Safe texture sample
        FragColor = texture(u_base_video, uv);
    }
}
