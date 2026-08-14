#version 330 core

in vec2 TexCoords;
out vec4 FragColor;

// Video/Picture sampler input
uniform sampler2D u_base_video; 

// Input resolutions to fix aspect ratio cropping bugs
uniform vec2 u_resolution; // Width and Height of the viewport/canvas

// Parameters from JSON configuration
uniform float u_stretch_x;
uniform float u_stretch_y;
uniform float u_skew_x;
uniform float u_skew_y;
uniform float u_rotation; // In Degrees

// Flip Toggles
uniform bool u_flip_h;
uniform bool u_flip_v;

void main()
{
    // 1. Calculate Aspect Ratio to prevent automatic squishing/cropping on wide screens
    float aspect = u_resolution.x / u_resolution.y;

    // 2. Shift coordinate origin to center (0.5, 0.5)
    vec2 uv = TexCoords - vec2(0.5);
    
    // Adjust X coordinate by aspect ratio so rotation does not warp or crop the edges
    uv.x *= aspect;

    // 3. APPLY FLIPS: Safely mirrored across the adjusted center point
    if (u_flip_h) uv.x = -uv.x;
    if (u_flip_v) uv.y = -uv.y;

    // 4. CRITICAL PROTECTION: Hard-clamp parameters away from exactly 0.0
    // If stretch is 0, the math collapses entirely into a single massive pixel block.
    // We force a minimum 0.001 size threshold to keep the matrix alive.
    float sX = (abs(u_stretch_x) < 0.001) ? 0.001 : u_stretch_x;
    float sY = (abs(u_stretch_y) < 0.001) ? 0.001 : u_stretch_y;

    // 5. Setup Trigonometry values for rotation
    float rad = radians(u_rotation);
    float cosR = cos(rad);
    float sinR = sin(rad);

    // 6. Construct Clean Inverse Transformation Matrices
    // Dividing maps canvas pixels back to the texture source without zooming bugs.
    mat2 scaleMat = mat2(
        1.0 / sX, 0.0,
        0.0,      1.0 / sY
    );

    // Skew Matrix with cross-axis isolation to prevent edge cropping collapses
    mat2 skewMat = mat2(
        1.0,       -u_skew_x,
        -u_skew_y,  1.0
    );

    // Rotation Matrix
    mat2 rotMat = mat2(
        cosR,  sinR,
       -sinR,  cosR
    );

    // 7. Calculate transformed coordinates sequentially
    uv = scaleMat * skewMat * rotMat * uv;

    // Undo the aspect ratio normalization before texture sampling
    uv.x /= aspect;

    // 8. Return coordinate origin to standard layout
    uv += vec2(0.5);

    // 9. CRITICAL EDGE CHECK: Prevents the edge pixels from smearing into solid color stripes
    // If the transformation calculation pushes coordinates outside the 0.0 - 1.0 texture zone,
    // we bypass texture sampling completely and draw clean transparency.
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        FragColor = vec4(0.0, 0.0, 0.0, 0.0); 
    } else {
        // High fidelity, uncropped, non-pixelated sample
        FragColor = texture(u_base_video, uv);
    }
}
