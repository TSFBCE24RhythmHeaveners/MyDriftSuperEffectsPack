// DO NOT ADD A #version TAG HERE. Qt 6 injects its own version block at runtime.

// 1. Native Qt6 texture mapping inputs (guarantees uncropped, full-frame alignment)
layout(location = 0) in vec2 qt_TexCoord0;

// 2. Output buffer targeting the active display canvas 
layout(location = 0) out vec4 FragColor;

// 3. The video frame texture uniform location
layout(binding = 1) uniform sampler2D source;

// 4. Memory-safe block containing all parameters from duotone.json
// This layout format prevents variable shifting, fixing the giant pixel bug.
layout(std140, binding = 0) uniform buf {
    mat4 qt_Matrix; // Hidden required engine matrix for UI placement
    float qt_Opacity; // Native opacity layer fallback
    
    float shadowR;
    float shadowG;
    float shadowB;

    float highlightR;
    float highlightG;
    float highlightB;

    float strength;
};

void main() {
    // Sample the exact video frame without breaking constraints
    vec4 baseColor = texture(source, qt_TexCoord0);
    
    // Perceptual grayscale luminance conversion (Rec. 709 standard)
    float luminance = dot(baseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    
    // Convert JSON slider outputs into color structures
    vec3 shadowColor = vec3(shadowR, shadowG, shadowB);
    vec3 highlightColor = vec3(highlightR, highlightG, highlightB);
    
    // Create the core duotone color transformation
    vec3 duotoneColor = mix(shadowColor, highlightColor, luminance);
    
    // Blend the effect using the strength slider configuration
    vec3 finalRGB = mix(baseColor.rgb, duotoneColor, strength);
    
    // Render the finished frame, retaining native transparency values
    FragColor = vec4(finalRGB, baseColor.a) * qt_Opacity;
}
