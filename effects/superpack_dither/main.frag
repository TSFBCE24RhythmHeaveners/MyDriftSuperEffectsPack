#version 330 core

uniform sampler2D u_currentTexture;
uniform vec2 u_resolution;

// User parameters
uniform float u_strength;           // 0.0 to 1.0
uniform float u_posterizeLevels;   // 2 to 16
uniform float u_ditherEnabled;     // 0.0 (off) or 1.0 (on)
uniform float u_ditherPixelSize;   // 1 to 16

in vec2 v_texCoord;
out vec4 fragColor;

// Bayer matrix 4x4
const mat4 bayerMatrix = mat4(
    0.0 / 16.0,  8.0 / 16.0,  2.0 / 16.0, 10.0 / 16.0,
    12.0 / 16.0, 4.0 / 16.0, 14.0 / 16.0, 6.0 / 16.0,
    3.0 / 16.0, 11.0 / 16.0,  1.0 / 16.0,  9.0 / 16.0,
    15.0 / 16.0, 7.0 / 16.0, 13.0 / 16.0, 5.0 / 16.0
);

// Get Bayer matrix value based on pixel position
float getBayerValue(vec2 pixelPos) {
    int x = int(mod(pixelPos.x, 4.0));
    int y = int(mod(pixelPos.y, 4.0));
    return bayerMatrix[y][x];
}

void main() {
    // Sample the current texture
    vec4 sourceColor = texture(u_currentTexture, v_texCoord);
    
    // Calculate pixel coordinates for dithering
    vec2 pixelCoord = v_texCoord * u_resolution;
    
    vec3 color = sourceColor.rgb;
    
    // Apply posterization
    // Quantize to the specified number of levels
    vec3 quantized = floor(color * (u_posterizeLevels - 1.0) + 0.5) / (u_posterizeLevels - 1.0);
    
    // Apply dithering if enabled
    if (u_ditherEnabled > 0.5) {
        // Calculate dithering pixel size offset
        vec2 ditherPixelCoord = floor(pixelCoord / u_ditherPixelSize) * u_ditherPixelSize;
        
        // Get Bayer dither threshold (0.0 to 1.0)
        float dithering = getBayerValue(ditherPixelCoord);
        
        // Apply dithering threshold per channel
        // Map Bayer value to a threshold that helps with color transitions
        float threshold = (dithering - 0.5) * (1.0 / u_posterizeLevels);
        
        vec3 dithered = color + threshold;
        quantized = floor(dithered * (u_posterizeLevels - 1.0) + 0.5) / (u_posterizeLevels - 1.0);
    }
    
    // Blend between original and posterized based on strength
    vec3 result = mix(color, quantized, u_strength);
    
    fragColor = vec4(result, sourceColor.a);
}
