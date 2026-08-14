#version 330 core

// Texture coordinates passed from Drift's vertex engine
in vec2 TexCoords;

// Uniform variables mapped from the JSON parameters
uniform sampler2D u_MainTexture; // Primary texture slot mapping

// Uniform parameters from JSON
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
    // 1. Safe sampling of the original video frame
    vec4 baseColor = texture(u_MainTexture, TexCoords);
    
    // 2. Safeguard: If strength is 0, immediately bypass calculations 
    // to prevent any zero-value glitches or solid color overrides.
    if (strength <= 0.0) {
        FragColor = baseColor;
        return;
    }
    
    // 3. Calculate grayscale luminance using standard digital video weights
    float luminance = dot(baseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    
    // 4. Assemble parameters into vec3 color structures
    vec3 shadowColor = vec3(shadowR, shadowG, shadowB);
    vec3 highlightColor = vec3(highlightR, highlightG, highlightB);
    
    // 5. Create the pure duotone color mapping
    vec3 duotoneColor = mix(shadowColor, highlightColor, luminance);
    
    // 6. Interpolate between original and duotone based on the strength slider
    vec3 finalRGB = mix(baseColor.rgb, duotoneColor, strength);
    
    // 7. Output final color, strictly preserving original alpha channel transparency
    FragColor = vec4(finalRGB, baseColor.a);
}
