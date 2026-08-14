#version 330 core

// Texture coordinates passed from Drift's vertex engine
in vec2 TexCoords;

// Uniform variables mapped from the JSON parameters
uniform sampler2D u_MainTexture; // The original video frame texture

uniform float shadowR;
uniform float shadowG;
uniform float shadowB;

uniform float highlightR;
uniform float highlightG;
uniform float highlightB;

uniform float strength;

// Output pixel color
out vec4 FragColor;

void main() {
    // 1. Sample the original video color
    vec4 baseColor = texture(u_MainTexture, TexCoords);
    
    // 2. Calculate grayscale luminance using standard digital video weights
    // (Rec. 709 weights balance human perception of Red, Green, and Blue)
    float luminance = dot(baseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    
    // 3. Assemble parameters into vec3 color representations
    vec3 shadowColor = vec3(shadowR, shadowG, shadowB);
    vec3 highlightColor = vec3(highlightR, highlightG, highlightB);
    
    // 4. Create the pure duotone color by mapping brightness to the gradient
    vec3 duotoneColor = mix(shadowColor, highlightColor, luminance);
    
    // 5. Interpolate between original and duotone based on the strength slider
    vec3 finalRGB = mix(baseColor.rgb, duotoneColor, strength);
    
    // 6. Output final color, preserving the video's native alpha channel
    FragColor = vec4(finalRGB, baseColor.a);
}
