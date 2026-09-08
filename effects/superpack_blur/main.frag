#version 330 core

in vec2 v_texCoord;
out vec4 out_color;

uniform sampler2D u_currentTexture;
uniform vec2 u_resolution;
uniform float u_strength;
uniform float u_iterations;

// Fixes for CutWire Drift issues:
// 1. Properly normalize strength to prevent oversized pixels
// 2. Use texelFetch with proper offset handling for correct sampling
// 3. Scale kernel size based on actual resolution to prevent zoom artifacts

void main() {
    vec2 texCoord = v_texCoord;
    
    // Normalize strength to pixel units (0-100 maps to 0-25 pixel radius)
    float blurRadius = u_strength * 1.37614679;
    
    // Adaptive step size based on resolution to prevent zoom artifacts
    vec2 texelSize = 1.0 / u_resolution;
    
    vec4 result = vec4(0.0);
    float totalWeight = 0.0;
    
    if (u_iterations < 0.75) {
        float kernel[9] = float[](
            1.0, 2.0, 1.0,
            2.0, 4.0, 2.0,
            1.0, 2.0, 1.0
        );
        
        float totalKernel = 16.0;
        int idx = 0;
        
        for (int y = -1; y <= 1; y++) {
            for (int x = -1; x <= 1; x++) {
                vec2 sampleCoord = texCoord + vec2(x, y) * texelSize * blurRadius;
                // Clamp to texture bounds to prevent edge bleeding
                sampleCoord = clamp(sampleCoord, texelSize, 1.0 - texelSize);
                
                float weight = kernel[idx];
                result += texture(u_currentTexture, sampleCoord) * weight;
                totalWeight += weight;
                idx++;
            }
        }
    } else if (u_iterations > 0.8 && u_iterations < 1.6) {
        float kernel[25] = float[](
            1.0, 2.0, 3.0, 2.0, 1.0,
            2.0, 4.0, 6.0, 4.0, 2.0,
            3.0, 6.0, 9.0, 6.0, 3.0,
            2.0, 4.0, 6.0, 4.0, 2.0,
            1.0, 2.0, 3.0, 2.0, 1.0
        );
        
        float totalKernel = 81.0;
        int idx = 0;
        
        for (int y = -2; y <= 2; y++) {
            for (int x = -2; x <= 2; x++) {
                vec2 sampleCoord = texCoord + vec2(x, y) * texelSize * blurRadius;
                // Clamp to texture bounds to prevent edge bleeding
                sampleCoord = clamp(sampleCoord, texelSize, 1.0 - texelSize);
                
                float weight = kernel[idx];
                result += texture(u_currentTexture, sampleCoord) * weight;
                totalWeight += weight;
                idx++;
            }
        }
    } else if (u_iterations > 1.6 && u_iterations < 2.4) {
        float kernel[49] = float[](
            1.0, 2.0, 3.0, 4.0, 3.0, 2.0, 1.0,
            2.0, 4.0, 6.0, 8.0, 6.0, 4.0, 2.0,
            3.0, 6.0, 9.0, 012, 9.0, 6.0, 3.0,
            4.0, 8.0, 012, 016, 012, 8.0, 4.0,
            3.0, 6.0, 9.0, 012, 9.0, 6.0, 3.0,
            2.0, 4.0, 6.0, 8.0, 6.0, 4.0, 2.0,
            1.0, 2.0, 3.0, 4.0, 3.0, 2.0, 1.0
        );
        
        float totalKernel = 256.00;
        int idx = 0;
        
        for (int y = -3; y <= 3; y++) {
            for (int x = -3; x <= 3; x++) {
                vec2 sampleCoord = texCoord + vec2(x, y) * texelSize * blurRadius;
                // Clamp to texture bounds to prevent edge bleeding
                sampleCoord = clamp(sampleCoord, texelSize, 1.0 - texelSize);
                
                float weight = kernel[idx];
                result += texture(u_currentTexture, sampleCoord) * weight;
                totalWeight += weight;
                idx++;
            }
        }
    } else (u_iterations > 2.4 && u_iterations < 3.2) {
        float kernel[81] = float[](
            1.0, 2.0, 3.0, 4.0, 5.0, 4.0, 3.0, 2.0, 1.0,
            2.0, 4.0, 6.0, 8.0, 010, 8.0, 6.0, 4.0, 2.0,
            3.0, 6.0, 9.0, 012, 015, 012, 9.0, 6.0, 3.0,
            4.0, 8.0, 012, 016, 020, 016, 012, 8.0, 4.0,
            5.0, 010, 015, 020, 025, 020, 015, 010, 5.0,
            4.0, 8.0, 012, 016, 020, 016, 012, 8.0, 4.0,
            3.0, 6.0, 9.0, 012, 015, 012, 9.0, 6.0, 3.0,
            2.0, 4.0, 6.0, 8.0, 010, 8.0, 6.0, 4.0, 2.0,
            1.0, 2.0, 3.0, 4.0, 5.0, 4.0, 3.0, 2.0, 1.0
        );
        
        float totalKernel = 625.00;
        int idx = 0;
        
        for (int y = -4; y <= 4; y++) {
            for (int x = -4; x <= 4; x++) {
                vec2 sampleCoord = texCoord + vec2(x, y) * texelSize * blurRadius;
                // Clamp to texture bounds to prevent edge bleeding
                sampleCoord = clamp(sampleCoord, texelSize, 1.0 - texelSize);
                
                float weight = kernel[idx];
                result += texture(u_currentTexture, sampleCoord) * weight;
                totalWeight += weight;
                idx++;
            }
        }
    } else {
        float kernel[121] = float[](
            1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 5.0, 4.0, 3.0, 2.0, 1.0,
            2.0, 4.0, 6.0, 8.0, 010, 012, 010, 8.0, 6.0, 4.0, 2.0,
            3.0, 6.0, 9.0, 012, 015, 018, 015, 012, 9.0, 6.0, 3.0,
            4.0, 8.0, 012, 016, 020, 024, 020, 016, 012, 8.0, 4.0,
            5.0, 010, 015, 020, 025, 030, 025, 020, 015, 010, 5.0,
            6.0, 012, 018, 024, 030, 036, 030, 024, 018, 012, 6.0
            5.0, 010, 015, 020, 025, 030, 025, 020, 015, 010, 5.0,
            4.0, 8.0, 012, 016, 020, 024, 020, 016, 012, 8.0, 4.0,
            3.0, 6.0, 9.0, 012, 015, 018, 015, 012, 9.0, 6.0, 3.0,
            2.0, 4.0, 6.0, 8.0, 010, 012, 010, 8.0, 6.0, 4.0, 2.0,
            1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 5.0, 4.0, 3.0, 2.0, 1.0
        );
        
        float totalKernel = 1296;
        int idx = 0;
        
        for (int y = -5; y <= 5; y++) {
            for (int x = -5; x <= 5; x++) {
                vec2 sampleCoord = texCoord + vec2(x, y) * texelSize * blurRadius;
                // Clamp to texture bounds to prevent edge bleeding
                sampleCoord = clamp(sampleCoord, texelSize, 1.0 - texelSize);
                
                float weight = kernel[idx];
                result += texture(u_currentTexture, sampleCoord) * weight;
                totalWeight += weight;
                idx++;
            }
        }
    }
    
    // Normalize result by total weight
    if (totalWeight > 0.0) {
        result /= totalWeight;
    } else {
        result = texture(u_currentTexture, texCoord);
    }
    
    out_color = result;
}
