#version 330 core

// Dedicated render target window out to Drift's compositor frame
out vec4 FragColor;

// Clean texture UV coordinates
in vec2 TexCoords;

// Active source frame buffer channel
uniform sampler2D u_texture;

// --- Uniform Adjustment Sliders (0% Risk Matrix Triggers) ---
uniform float u_brightness;  
uniform float u_contrast;    
uniform float u_saturation;  
uniform float u_hue; 
uniform float u_temperature; 
uniform float u_tint;        

void main() {
    // 1. ISOLATED FIRST-STAGE SAMPLING
    vec4 rawColor = texture(u_texture, TexCoords);
    vec3 color = rawColor.rgb;

    // 2. DEFENSIVE PARAMETER ISOLATION (Bypasses driver calculation failures)
    float b = clamp(u_brightness, 0.0, 2.0);
    float c = clamp(u_contrast, 0.0, 2.0);
    float s = clamp(u_saturation, 0.0, 3.0);
    float temp = clamp(u_temperature, -1.0, 1.0) * 0.15;
    float tint = clamp(u_tint, -1.0, 1.0) * 0.10;

    // Convert Hue to pure radians for matrix rotations
    float hueRad = clamp(u_hue, -360.0, 360.0) * 0.01745329251; // pi / 180

    // 3. APPLY BRIGHTNESS & TEMPERATURE/TINT WARMTH DIRECTLY
    color *= b;
    color.r += temp + (tint * 0.5);
    color.g -= (tint * 0.8);
    color.b -= temp - (tint * 0.5);

    // 4. MATRIX TRANSFORMATION FOR CONTRAST & SATURATION
    // Standard luminance weights for video formats (Rec. 709 / Rec. 601 mix)
    vec3 luma = vec3(0.299, 0.587, 0.114);
    
    // Calculate contrast offset lineary around 0.5 middle grey
    color = (color - vec3(0.5)) * c + vec3(0.5);

    // Saturation Matrix transformation
    float oneMinusSat = 1.0 - s;
    mat3 satMatrix = mat3(
        (luma.x * oneMinusSat) + s,       luma.x * oneMinusSat,             luma.x * oneMinusSat,
        luma.y * oneMinusSat,             (luma.y * oneMinusSat) + s,       luma.y * oneMinusSat,
        luma.z * oneMinusSat,             luma.z * oneMinusSat,             (luma.z * oneMinusSat) + s
    );
    color = satMatrix * color;

    // 5. MATRIX TRANSFORMATION FOR HUE DEGREES (Eliminates the HSV loop entirely)
    float cosH = cos(hueRad);
    float sinH = sin(hueRad);
    
    // Pure mathematical rotation vector matrix around the luminance axis
    mat3 hueMatrix = mat3(
        cosH + (1.0 - cosH) / 3.0,          (1.0 - cosH) / 3.0 - sqrt(1.0 / 3.0) * sinH, (1.0 - cosH) / 3.0 + sqrt(1.0 / 3.0) * sinH,
        (1.0 - cosH) / 3.0 + sqrt(1.0 / 3.0) * sinH, cosH + (1.0 - cosH) / 3.0,          (1.0 - cosH) / 3.0 - sqrt(1.0 / 3.0) * sinH,
        (1.0 - cosH) / 3.0 - sqrt(1.0 / 3.0) * sinH, (1.0 - cosH) / 3.0 + sqrt(1.0 / 3.0) * sinH, cosH + (1.0 - cosH) / 3.0
    );
    color = hueMatrix * color;

    // 6. OUTPUT STAGE: Solid range lock keeping source frame transparency intact
    FragColor = vec4(clamp(color, 0.0, 1.0), rawColor.a);
}
