#version 440

// Standard Qt6 / QML video post-processing inputs
layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;

// CutWire Drift core sampler uniform
layout(binding = 1) uniform sampler2D source;

// Core UI control variables mapping to your parameters
layout(std140, binding = 0) uniform buf {
    mat4 qt_Matrix;
    float qt_Opacity;
    
    // Custom user parameters
    float u_Temperature; // Negative = Cool (Blue), Positive = Warm (Amber)
    float u_Tint;        // Negative = Green,        Positive = Pink/Magenta
    float u_Saturation;  // Negative = Grayscale,    Positive = Intense Color
};

void main() 
{
    // 1. Fetch exact pixel mapping to fix "Oversized Pixel/Offset Zoom" bugs
    vec4 texColor = texture(source, qt_TexCoord0);
    vec3 color = texColor.rgb;

    // 2. TEMPERATURE COMPENSATOR (Negative = Cold, Positive = Hot)
    // Warm vector adds red/yellow; Cool vector adds blue/cyan
    vec3 warmShift = vec3(0.15, 0.05, -0.10);
    vec3 coolShift = vec3(-0.15, -0.05, 0.20);
    vec3 tempDelta = (u_Temperature >= 0.0) ? (warmShift * u_Temperature) : (coolShift * abs(u_Temperature));
    color += tempDelta;

    // 3. TINT COMPENSATOR (Negative = Green, Positive = Pink)
    // Pink adds red+blue while lowering green. Green lowers red+blue while raising green.
    vec3 pinkShift = vec3(0.10, -0.15, 0.10);
    vec3 greenShift = vec3(-0.10, 0.15, -0.10);
    vec3 tintDelta = (u_Tint >= 0.0) ? (pinkShift * u_Tint) : (greenShift * abs(u_Tint));
    color += tintDelta;

    // 4. SATURATION COMPENSATOR (Negative = Gray, Positive = Colorful)
    // Uses standard Rec. 709 luma coefficients for accurate human perception gray scales
    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    
    if (u_Saturation < 0.0) {
        // Smoothly blend to full grayscale as u_Saturation approaches -1.0
        color = mix(color, vec3(luma), abs(u_Saturation));
    } else {
        // Push colors outward from their luma baseline for positive saturation
        color = mix(vec3(luma), color, 1.0 + u_Saturation);
    }

    // 5. PROTECTION STRATEGIES (Prevents visual breaks and keeps transparency)
    color = clamp(color, 0.0, 1.0);
    fragColor = vec4(color, texColor.a) * qt_Opacity;
}
