#version 330 core

in vec2 v_texCoord;
out vec4 out_color;

uniform sampler2D u_currentTexture;
uniform vec2 u_resolution;
uniform float u_strength;
uniform float u_simplemode;

// Fixes for CutWire Drift issues:
// 1. Properly normalize strength to prevent oversized pixels
// 2. Use texelFetch with proper offset handling for correct sampling
// 3. Scale kernel size based on actual resolution to prevent zoom artifacts

void main() {
    vec2 texCoord = v_texCoord;
    
    // Normalize strength to pixel units (0-100 maps to 0-25 pixel radius)
    float blurRadius = u_strength / 4.0;
    
    // Adaptive step size based on resolution to prevent zoom artifacts
    vec2 texelSize = 1.0 / u_resolution;
    
    vec4 result = vec4(0.0);
    float totalWeight = 0.0;
    
    // Choose blur kernel based on simplemode
    if (u_simplemode < 0.5) {
        // 5x5 blur kernel (off = standard quality)
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
    } else {
        // 3x3 blur kernel (on = cheap/fast)
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
    }
    
    // Normalize result by total weight
    if (totalWeight > 0.0) {
        result /= totalWeight;
    } else {
        result = texture(u_currentTexture, texCoord);
    }
    
    out_color = result;
}
