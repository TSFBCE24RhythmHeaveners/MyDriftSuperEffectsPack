#version 330 core

out vec4 FragColor;
in vec2 TexCoords;
uniform sampler2D u_texture;

// --- Uniform Adjustment Sliders ---
uniform float u_brightness;  
uniform float u_contrast;    
uniform float u_saturation;  
uniform float u_temperature; 
uniform float u_tint;        

// Updated: Expects degrees from 0.0 to 360.0 (Default: 0.0)
uniform float u_hue; 

// --- Helper Functions ---
vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec4 texColor = texture(u_texture, TexCoords);
    vec3 color = texColor.rgb;

    // Brightness & Contrast
    color *= u_brightness;
    color = (color - 0.5) * u_contrast + 0.5;

    // White Balance
    color.r += u_temperature * 0.12;
    color.b -= u_temperature * 0.12;
    color.g -= u_tint * 0.08;
    color.r += u_tint * 0.05;
    color.b += u_tint * 0.05;

    // Color Space Shifts
    vec3 hsv = rgb2hsv(color);
    
    // Convert 0-360 degrees to a normalized 0.0-1.0 range and wrap safely
    float normalizedHueShift = u_hue / 360.0;
    hsv.x = mod(hsv.x + normalizedHueShift, 1.0); 
    
    hsv.y *= u_saturation;           
    color = hsv2rgb(hsv);

    FragColor = vec4(clamp(color, 0.0, 1.0), texColor.a);
}
