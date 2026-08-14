#version 330 core

// Native mapping coordinates utilized by the underlying UI engine
in vec2 qt_TexCoord0;

// The official video stream uniform texture slot
uniform sampler2D source;

// Effect parameters mapped explicitly from your JSON layout
uniform float shadowR;
uniform float shadowG;
uniform float shadowB;

uniform float highlightR;
uniform float highlightG;
uniform float highlightB;

uniform float strength;

out vec4 FragColor;

void main() {
    // 1. Fetch the raw video color from the active frame
    vec4 baseColor = texture(source, qt_TexCoord0);
    
    // 2. Compute true luma weightings
    float luminance = dot(baseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    
    // 3. Assemble custom color thresholds
    vec3 shadowColor = vec3(shadowR, shadowG, shadowB);
    vec3 highlightColor = vec3(highlightR, highlightG, highlightB);
    
    // 4. Map the video tones to your two target colors
    vec3 duotoneColor = mix(shadowColor, highlightColor, luminance);
    
    // 5. Apply the strength slider to control total color intensity
    vec3 finalRGB = mix(baseColor.rgb, duotoneColor, strength);
    
    // 6. Return the finished frame, retaining the native transparency layer
    FragColor = vec4(finalRGB, baseColor.a);
}
