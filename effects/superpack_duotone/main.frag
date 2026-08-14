#version 330 core

// 1. Native Qt6 texture mapping coordinates. 
// Do NOT rename this or add fallback coordinate variables, 
// as it breaks CutWire Drift's internal texture atlas padding.
in vec2 qt_TexCoord0;

// 2. The native video stream texture uniform slot required by the Drift engine
uniform sampler2D source;

// 3. Sliders mapped directly from your duotone.json properties
uniform float shadowR;
uniform float shadowG;
uniform float shadowB;

uniform float highlightR;
uniform float highlightG;
uniform float highlightB;

uniform float strength;

// Output color buffer channel
out vec4 FragColor;

void main() {
    // Fetch the raw video frame directly using native, unhampered coordinates.
    // This stops both the single-pixel and cropped-zoom glitches entirely.
    vec4 baseColor = texture(source, qt_TexCoord0);
    
    // Compute exact perceptual luminance (Rec. 709 standard)
    float luminance = dot(baseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    
    // Convert R, G, B slider parameters into color vectors
    vec3 shadowColor = vec3(shadowR, shadowG, shadowB);
    vec3 highlightColor = vec3(highlightR, highlightG, highlightB);
    
    // Interpolate the colors across the video's grayscale values
    vec3 duotoneColor = mix(shadowColor, highlightColor, luminance);
    
    // Mix the original image with the duotone color based on effect strength
    vec3 finalRGB = mix(baseColor.rgb, duotoneColor, strength);
    
    // Output the completed frame, matching the native video transparency layer
    FragColor = vec4(finalRGB, baseColor.a);
}
