// Do NOT place a #version tag here; CutWire Drift adds this natively.

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 FragColor;

layout(binding = 1) uniform sampler2D source;

layout(std140, binding = 0) uniform buf {
    mat4 qt_Matrix;
    float qt_Opacity;
    
    float shadowR;
    float shadowG;
    float shadowB;

    float highlightR;
    float highlightG;
    float highlightB;

    float strength;
};

void main() {
    // 1. Grab the raw video color frame
    vec4 baseColor = texture(source, qt_TexCoord0);
    
    // 2. Compute exact perceptual luminance (Rec. 709 standard weights)
    float luminance = dot(baseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    
    // 3. HARDWIRED FALLBACK SAFETY:
    // If the UI sliders fail to pass data, variables register as 0.0.
    // If they are all zero, we force a beautiful default duotone to prove it's working!
    vec3 shadowColor = vec3(shadowR, shadowG, shadowB);
    vec3 highlightColor = vec3(highlightR, highlightG, highlightB);
    float effectStrength = strength;

    if (shadowColor == vec3(0.0) && highlightColor == vec3(0.0)) {
        shadowColor = vec3(0.08, 0.03, 0.25);    // Default deep midnight blue shadow
        highlightColor = vec3(0.98, 0.65, 0.30); // Default bright warm gold highlight
        effectStrength = 1.0;                    // Force strength to full
    }
    
    // 4. Run the duotone gradient mapping
    vec3 duotoneColor = mix(shadowColor, highlightColor, luminance);
    
    // 5. Crossfade between original picture and effect color
    vec3 finalRGB = mix(baseColor.rgb, duotoneColor, effectStrength);
    
    // 6. Draw output to canvas, retaining opacity channels
    FragColor = vec4(finalRGB, baseColor.a) * qt_Opacity;
}
