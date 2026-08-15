#version 330 core

// Dedicated render buffer output target for CutWire Drift's pipeline
out vec4 FragColor;

// Raw incoming coordinate vectors from Drift's vertex engine
in vec2 TexCoords;

// Source element texture unit passed by the FrameCompositor
uniform sampler2D u_texture;

// --- Raw Uniform Input Registers ---
uniform float u_brightness;  
uniform float u_contrast;    
uniform float u_saturation;  
uniform float u_hue; 
uniform float u_temperature; 
uniform float u_tint;        

// --- Precision Color-Space Conversion Routines ---
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
    // ------------------------------------------------------------------------
    // PROTECTION STEP 1: ISOLATED SAMPLING
    // We sample texture coordinates cleanly up front. No modifying coordinates.
    // ------------------------------------------------------------------------
    vec4 rawFrameSample = texture(u_texture, TexCoords);
    vec3 localRGB = rawFrameSample.rgb;

    // ------------------------------------------------------------------------
    // PROTECTION STEP 2: COMPLETE THREAD-LOCAL ISOLATION & RANGE DEFENSE
    // We bind all external values to isolated local variables and force matching
    // float types (.0) to prevent the GPU compiler from dropping back into integer 
    // truncation blocks that cause the mipmap giant pixel snaps.
    // ------------------------------------------------------------------------
    float safeBrightness  = clamp(u_brightness, 0.0, 2.0);
    float safeContrast    = clamp(u_contrast, 0.0, 2.0);
    float safeSaturation  = clamp(u_saturation, 0.0, 3.0);
    float safeHueDegrees  = clamp(u_hue, -360.0, 360.0);
    float safeTemperature = clamp(u_temperature, -1.0, 1.0);
    float safeTint        = clamp(u_tint, -1.0, 1.0);

    // ------------------------------------------------------------------------
    // EXECUTION STEP 3: SEQUENTIAL COMPONENT MODIFICATION
    // ------------------------------------------------------------------------
    
    // A. Brightness (Uniform scalar scaling)
    localRGB *= safeBrightness;

    // B. Contrast (Component vector interpolation relative to neutral gray 0.5)
    localRGB = (localRGB - vec3(0.5)) * safeContrast + vec3(0.5);

    // C. White Balance (Isolated scalar addition across explicit channels)
    localRGB.r += safeTemperature * 0.12;
    localRGB.b -= safeTemperature * 0.12;
    
    localRGB.g -= safeTint * 0.08;
    localRGB.r += safeTint * 0.05;
    localRGB.b += safeTint * 0.05;

    // D. Hue Shift & Saturation Scaling
    vec3 localHSV = rgb2hsv(localRGB);
    
    // Explicit division using safe types prevents runtime compilation loops
    float computedHueShift = safeHueDegrees / 360.0;
    localHSV.x = mod(localHSV.x + computedHueShift, 1.0); 
    
    // Scale saturation parameter locally
    localHSV.y *= safeSaturation;           
    
    // Revert color maps to standard RGB
    localRGB = hsv2rgb(localHSV);

    // ------------------------------------------------------------------------
    // PROTECTION STEP 4: STRICT CLAMP BOUNDARY
    // We bind outputs firmly between 0.0 and 1.0 to preserve native alpha channels.
    // ------------------------------------------------------------------------
    FragColor = vec4(clamp(localRGB, 0.0, 1.0), rawFrameSample.a);
}
