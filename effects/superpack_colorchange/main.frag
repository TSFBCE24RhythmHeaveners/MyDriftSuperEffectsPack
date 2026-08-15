#version 330 core

// Drift standard layout coordinates and texture sampler
in vec2 qt_TexCoord0; 
uniform sampler2D qt_Texture0; // The source frame texture

// Custom uniform parameters defined in our JSON
uniform float u_Temperature;  // [-1.0 to 1.0] -> negative=cool, positive=warm
uniform float u_Tint;         // [-1.0 to 1.0] -> negative=green, positive=pink
uniform float u_Saturation;   // [-1.0 to 1.0] -> negative=gray, positive=colorful

out vec4 fragColor;

void main()
{
    // Fixes Zoomed In / Giant Pixel Bugs: Fetch base frame using exact, 
    // normalized texture coordinates natively tracked by Drift's compositor framework.
    vec4 sourceColor = texture(qt_Texture0, qt_TexCoord0);
    vec3 rgb = sourceColor.rgb;

    // 1. TEMPERATURE ADJUSTMENT
    // Positive pushes Red/Yellow (warm). Negative pushes Blue (cool).
    if (u_Temperature > 0.0) {
        rgb.r += u_Temperature * 0.15;
        rgb.b -= u_Temperature * 0.10;
    } else {
        rgb.r += u_Temperature * 0.10; // (Adds negative value, reducing red)
        rgb.b -= u_Temperature * 0.15; // (Subtracting negative value, boosting blue)
    }

    // 2. TINT ADJUSTMENT
    // Positive pushes Magenta/Pink (G decreases, R/B increase). Negative pushes Green (G increases).
    if (u_Tint > 0.0) {
        rgb.g -= u_Tint * 0.12;
        rgb.r += u_Tint * 0.08;
        rgb.b += u_Tint * 0.08;
    } else {
        rgb.g -= u_Tint * 0.15; // Subtracting a negative increases green
        rgb.r += u_Tint * 0.05;
        rgb.b += u_Tint * 0.05;
    }

    // 3. SATURATION ADJUSTMENT
    // Standard precise luminance weights for video signals
    float luminance = dot(rgb, vec3(0.299, 0.587, 0.114));
    
    // Remap UI slider from [-1.0, 1.0] to an engineering multiplier [0.0, 2.0]
    // -1.0 results in 0.0 (total grayscale)
    //  0.0 results in 1.0 (unmodified baseline color)
    //  1.0 results in 2.0 (boosted vivid colors)
    float satFactor = u_Saturation + 1.0;
    rgb = mix(vec3(luminance), rgb, satFactor);

    // Prevent color blowout outside system boundaries
    rgb = clamp(rgb, 0.0, 1.0);

    // Output final color with preserved original transparency layer
    fragColor = vec4(rgb, sourceColor.a);
}
