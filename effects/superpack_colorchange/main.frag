#version 330 core

// Drift standard layout coordinates and texture sampler
in vec2 qt_TexCoord0; 
uniform sampler2D qt_Texture0; // The source frame texture

// Custom uniform parameters defined in our JSON
uniform float u_Temperature;  // [-1.0 to 1.0] -> negative=cool, positive=warm
uniform float u_Tint;         // [-1.0 to 1.0] -> negative=green, positive=pink
uniform float u_Saturation;   // [-1.0 to 1.0] -> negative=gray, positive=colorful

out vec4 fragColor;

// Safe sanitization function to destroy NaNs/Infinities before they turn into black pixels
vec3 sanitizeColor(vec3 color) {
    // isnan() and isinf() ensure mathematical anomalies evaluate safely to baseline 0.0
    bvec3 bad_nan = isnan(color);
    bvec3 bad_inf = isinf(color);
    
    // If a channel is NaN or Inf, force it to 0.0, otherwise keep the color channel
    color.r = (bad_nan.r || bad_inf.r) ? 0.0 : color.r;
    color.g = (bad_nan.g || bad_inf.g) ? 0.0 : color.g;
    color.b = (bad_nan.b || bad_inf.b) ? 0.0 : color.b;
    
    // Final defensive lock into legal [0.0, 1.0] viewport rendering boundaries
    return clamp(color, 0.0, 1.0);
}

void main()
{
    // Fixes Zoomed In / Giant Pixel Bugs: Extract texture safely
    vec4 sourceColor = texture(qt_Texture0, qt_TexCoord0);
    vec3 rgb = sourceColor.rgb;

    // 1. TEMPERATURE ADJUSTMENT (With intermediate channel clamping)
    if (u_Temperature > 0.0) {
        rgb.r += u_Temperature * 0.15;
        rgb.b -= u_Temperature * 0.10;
    } else {
        rgb.r += u_Temperature * 0.10; 
        rgb.b -= u_Temperature * 0.15; 
    }
    rgb = clamp(rgb, 0.0, 1.0); // Fixes black pixel artifacts from underflow loops

    // 2. TINT ADJUSTMENT (With intermediate channel clamping)
    if (u_Tint > 0.0) {
        rgb.g -= u_Tint * 0.12;
        rgb.r += u_Tint * 0.08;
        rgb.b += u_Tint * 0.08;
    } else {
        rgb.g -= u_Tint * 0.15; 
        rgb.r += u_Tint * 0.05;
        rgb.b += u_Tint * 0.05;
    }
    rgb = clamp(rgb, 0.0, 1.0); // Prevents channels from bleeding into negative spaces

    // 3. SATURATION ADJUSTMENT
    // Video-standard luminance calculation weights
    float luminance = dot(rgb, vec3(0.299, 0.587, 0.114));
    
    // Remap UI slider safely from [-1.0, 1.0] to a positive multiplier [0.0, 2.0]
    float satFactor = clamp(u_Saturation + 1.0, 0.0, 2.0);
    rgb = mix(vec3(luminance), rgb, satFactor);

    // 4. CHANNELS SANITIZATION DEFENDE
    // Catches any unexpected math anomalies and anchors the colors perfectly
    rgb = sanitizeColor(rgb);

    // Output clean color data while completely retaining track transparency rules
    fragColor = vec4(rgb, sourceColor.a);
}
