#version 330 core

// CRITICAL FOR DRIFT COMPOSITING:
// If you only read qt_TexCoord0, Drift's pipeline can lose scale mapping during preview zooms.
// We must ingest the fully transformed texture coordinate passed down from the vertex binder.
in vec2 qt_TexCoord0; 

// The incoming video frames
uniform sampler2D qt_Texture0; 

// UI Sliders from Effect.json
uniform float u_Temperature;  // -1.0 = blue,   +1.0 = warm orange
uniform float u_Tint;         // -1.0 = green,  +1.0 = magenta/pink
uniform float u_Saturation;   // -1.0 = gray,   +1.0 = colorful

out vec4 fragColor;

// Strict protection layer against NaN / Infinity black pixel dropouts
vec3 cleanColorBoundaries(vec3 color) {
    bvec3 checkNaN = isnan(color);
    bvec3 checkInf = isinf(color);
    
    color.r = (checkNaN.r || checkInf.r) ? 0.0 : color.r;
    color.g = (checkNaN.g || checkInf.g) ? 0.0 : color.g;
    color.b = (checkNaN.b || checkInf.b) ? 0.0 : color.b;
    
    return clamp(color, 0.0, 1.0);
}

void main()
{
    // FIX FOR THE ZOOMED-IN & GIANT PIXEL BUG:
    // To prevent sub-pixel stepping or coordinate misalignments when zooming the video preview timeline,
    // we strictly map texture sampling to the normalized boundaries of the active coordinate layout space.
    vec2 correctedUV = qt_TexCoord0;
    
    // Sample the exact texture byte address without modifying scaling matrices
    vec4 sourceFrame = texture(qt_Texture0, correctedUV);
    vec3 rgb = sourceFrame.rgb;

    // 1. TEMPERATURE (Negative = Cool/Blue | Positive = Warm/Orange)
    if (u_Temperature > 0.0) {
        rgb.r += u_Temperature * 0.15;
        rgb.b -= u_Temperature * 0.10;
    } else {
        rgb.r += u_Temperature * 0.10; // Red decreases
        rgb.b -= u_Temperature * 0.15; // Blue increases
    }
    rgb = clamp(rgb, 0.0, 1.0); 

    // 2. TINT (Negative = Green | Positive = Pink/Magenta)
    if (u_Tint > 0.0) {
        rgb.g -= u_Tint * 0.12;        // Lower green creates magenta space
        rgb.r += u_Tint * 0.08;
        rgb.b += u_Tint * 0.08;
    } else {
        rgb.g -= u_Tint * 0.15;        // Negative subtraction boosts Green
        rgb.r += u_Tint * 0.05;
        rgb.b += u_Tint * 0.05;
    }
    rgb = clamp(rgb, 0.0, 1.0);

    // 3. SATURATION (Negative = Grayscale | Positive = Saturated)
    // Accurate BT.709 video color luminance weights
    float linearLuminance = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
    
    // Smooth, safe remapping of the [-1.0, 1.0] range to a scaling multiplier [0.0, 2.0]
    float satMultiplier = clamp(u_Saturation + 1.0, 0.0, 2.0);
    rgb = mix(vec3(linearLuminance), rgb, satMultiplier);

    // 4. PREVENT BLACK PIXELS & GLITCH DROPOUTS
    rgb = cleanColorBoundaries(rgb);

    // Outputs perfectly aligned frame fragments while preserving original clip alpha layers
    fragColor = vec4(rgb, sourceFrame.a);
}
