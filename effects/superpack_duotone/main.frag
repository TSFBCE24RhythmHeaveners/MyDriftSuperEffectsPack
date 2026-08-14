#version 330 core

// 1. Core structural inputs from Drift's vertex generator
// We remove coordinate fallbacks and loops which break sub-region calculations.
in vec2 TexCoords;

// 2. Uniform layout bindings matching the Drift compositor pipeline
uniform sampler2D u_MainTexture; 

// 3. User Parameters mapped directly via duotone.json
uniform float shadowR;
uniform float shadowG;
uniform float shadowB;

uniform float highlightR;
uniform float highlightG;
uniform float highlightB;

uniform float strength;

out vec4 FragColor;

void main() {
    // Pass the standard vertex coordinates directly to sample the frame.
    // Overriding this or wrapping it in length conditionals forces the GPU 
    // to lose track of sub-texture clipping regions, causing the zoomed/cropped look.
    vec4 baseColor = texture(u_MainTexture, TexCoords);
    
    // Calculate standard Rec. 709 grayscale luminance weights
    float luminance = dot(baseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    
    // Assemble sliders into colors
    vec3 shadowColor = vec3(shadowR, shadowG, shadowB);
    vec3 highlightColor = vec3(highlightR, highlightG, highlightB);
    
    // Interpolate across the grayscale range
    vec3 duotoneColor = mix(shadowColor, highlightColor, luminance);
    
    // Apply effect strength configuration
    vec3 finalRGB = mix(baseColor.rgb, duotoneColor, strength);
    
    // Return final rendering pass, preserving full alpha channels
    FragColor = vec4(finalRGB, baseColor.a);
}
