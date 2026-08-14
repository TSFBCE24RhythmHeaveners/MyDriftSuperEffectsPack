#version 330 core

// 1. Coordinates: We declare both common variations to force the GPU 
// to bind the texture mapping correctly across the full layout.
in vec2 TexCoords;
in vec2 qt_TexCoord0;

// 2. The Video Frame Texture input
uniform sampler2D u_currentTexture;

// 3. User Parameters from JSON
uniform float shadowR;
uniform float shadowG;
uniform float shadowB;

uniform float highlightR;
uniform float highlightG;
uniform float highlightB;

uniform float strength;

out vec4 FragColor;

void main() {
    // Determine which coordinate variable the engine active-bound.
    // If TexCoords is empty (0.0), it falls back seamlessly to qt_TexCoord0.
    vec2 uv = (length(TexCoords) > 0.0) ? TexCoords : qt_TexCoord0;
    
    // Safety check: If uv is still stuck at absolute zero due to layout binding,
    // we generate a coordinate map from the screen to bypass the single-pixel trap.
    if (uv.x == 0.0 && uv.y == 0.0) {
        // Fallback standard calculation: creates screen coordinates dynamically
        // assuming standard gl_FragCoord behavior if vertex layout completely drops.
        uv = vec2(gl_FragCoord.x / 1920.0, gl_FragCoord.y / 1080.0); 
    }

    // 4. Sample the frame using a dynamic texture selector macro check
    vec4 baseColor = texture(source, uv);
    if (baseColor.a == 0.0 && baseColor.rgb == vec3(0.0)) {
        baseColor = texture(u_MainTexture, uv);
    }
    
    // 5. Compute standard luma weights
    float luminance = dot(baseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    
    // 6. Map the colors
    vec3 shadowColor = vec3(shadowR, shadowG, shadowB);
    vec3 highlightColor = vec3(highlightR, highlightG, highlightB);
    vec3 duotoneColor = mix(shadowColor, highlightColor, luminance);
    
    // 7. Apply effect depth scaling
    vec3 finalRGB = mix(baseColor.rgb, duotoneColor, strength);
    
    FragColor = vec4(finalRGB, baseColor.a);
}
