// Do NOT include a #version directive here.

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 FragColor;

layout(binding = 1) uniform sampler2D source;

// The uniform block variables must explicitly mirror the case-sensitive 
// parameter IDs specified in the duotone.json file to form a proper data bridge.
layout(std140, binding = 0) uniform buf {
    mat4 qt_Matrix;
    float qt_Opacity;
    
    float shadowR;
    float shadowG;
    float shadowB;

    float highlightR;
    float highlightG;
    float highlightB;

    float Strength;
};

void main() {
    // 1. Fetch the raw frame color natively
    vec4 baseColor = texture(source, qt_TexCoord0);
    
    // 2. Extract standard Rec. 709 luminance values
    float luminance = dot(baseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    
    // 3. Setup user variables
    vec3 shadowColor = vec3(shadowR, shadowG, shadowB);
    vec3 highlightColor = vec3(highlightR, highlightG, highlightB);
    float effectStrength = Strength;

    // 4. CONNECTION BREAK PROTECTION:
    // If the slider input link is totally dead, Strength will default to 0.0.
    // We override that zero state right here to force a noticeable test effect.
    if (effectStrength == 0.0 && shadowColor == vec3(0.0) && highlightColor == vec3(0.0)) {
        shadowColor = vec3(0.1, 0.05, 0.4);     // Test Deep Purple
        highlightColor = vec3(0.95, 0.6, 0.1);  // Test Bright Orange
        effectStrength = 1.0;                   // Force effect visibility
    }
    
    // 5. Generate the duotone color mapping
    vec3 duotoneColor = mix(shadowColor, highlightColor, luminance);
    
    // 6. Crossfade over original clip channels
    vec3 finalRGB = mix(baseColor.rgb, duotoneColor, effectStrength);
    
    // 7. Render out the transformed frame pixels safely
    FragColor = vec4(finalRGB, baseColor.a) * qt_Opacity;
}
