#version 330 core

in vec2 TexCoords;
out vec4 FragColor;

// Video/Picture sampler input
uniform sampler2D u_MainTexture;

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

    // 2. CRITICAL PROTECTION: Prevent division-by-zero or near-zero scaling matrices
    // If Stretch parameters hit exactly 0.0, it collapses the image into a single oversized pixel.
    float safe_stretch_x = (abs(u_stretch_x) < 0.001) ? 0.001 : u_stretch_x;
    float safe_stretch_y = (abs(u_stretch_y) < 0.001) ? 0.001 : u_stretch_y;

    // 3. Setup Trigonometry values for rotation
    float rad = radians(u_rotation);
    float cosR = cos(rad);
    float sinR = sin(rad);

    // 4. Construct Transformation Matrices
    // Using Inverse Mapping (Dividing instead of multiplying) 
    // This maps the output canvas back to the source texture correctly.
    mat2 scaleMat = mat2(
        1.0 / safe_stretch_x, 0.0,
        0.0,                  1.0 / safe_stretch_y
    );

    // Skew Matrix protection (prevents infinite shear collapses)
    mat2 skewMat = mat2(
        1.0,      -u_skew_x,
        -u_skew_y, 1.0
    );

    // Rotation Matrix
    mat2 rotMat = mat2(
        cosR,  sinR,
       -sinR,  cosR
    );

    // 5. Apply the operations sequentially to the centered vector
    // Scale -> Skew -> Rotate order prevents recursive mathematical distortion
    uv = scaleMat * skewMat * rotMat * uv;

    // 6. Return origin to standard bottom-left layout
    uv += vec2(0.5);

    // 7. CRITICAL BLOCK: Edge Out-Of-Bounds Handling
    // Instead of stretching the boundary pixel forever across the screen,
    // this instantly cuts off the drawing matrix outside the 0.0 - 1.0 UV limits.
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        // Clear transparent background outside the transformed bounds
        FragColor = vec4(0.0, 0.0, 0.0, 0.0); 
    } else {
        // Clean, proportional texture lookup
        FragColor = texture(u_base_video, uv);
    }
}
