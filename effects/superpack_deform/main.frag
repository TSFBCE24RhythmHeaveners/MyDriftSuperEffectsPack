#version 330 core

in vec2 TexCoords;
out vec4 FragColor;

// Video sampler input
uniform sampler2D u_base_video; 

// Parameters fed by our JSON setup
uniform float u_stretch_x;
uniform float u_stretch_y;
uniform float u_skew_x;
uniform float u_skew_y;
uniform float u_rotation; // Degrees

void main()
{
    // 1. Shift origin to the center of the video frame (0.5, 0.5)
    vec2 uv = TexCoords - vec2(0.5);

    // 2. Convert rotation to Radians
    float rad = radians(u_rotation);
    float cosR = cos(rad);
    float sinR = sin(rad);

    // 3. Create Inverse Math Transformation Matrices
    // Handled in reverse order to cleanly map the target canvas to the source texture
    
    // Rotation Matrix
    mat2 rotMat = mat2(
        cosR, -sinR,
        sinR,  cosR
    );

    // Skew Matrix 
    mat2 skewMat = mat2(
        1.0,      u_skew_x,
        u_skew_y, 1.0
    );

    // Stretch Matrix (Inverse mapping means dividing to stretch outwards)
    mat2 scaleMat = mat2(
        1.0 / u_stretch_x, 0.0,
        0.0,               1.0 / u_stretch_y
    );

    // 4. Combine operations and translate back to normal space
    uv = rotMat * skewMat * scaleMat * uv;
    uv += vec2(0.5);

    // 5. CRITICAL FIX: Prevent the video from smearing into a solid flat color
    // If transformed coordinates roll past the screen boundary, do not clamp/stretch.
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        // Discards empty canvas space or defaults to an empty transparent alpha layer
        discard; 
    } else {
        // Render the safe, undistorted base pixel colors directly
        FragColor = texture(u_base_video, uv);
    }
}
