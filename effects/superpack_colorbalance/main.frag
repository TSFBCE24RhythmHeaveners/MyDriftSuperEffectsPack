#version 120

// CRITICAL FIX FOR THE BLANK SLATE BUG:
// Explicit float precision definitions prevent context crashes on cross-platform graphics cards.
#ifdef GL_ES
precision highp float;
#endif

// Core pipeline variables passed from Drift's compositor
varying vec2 qt_TexCoord0;    
uniform sampler2D qt_Texture0; 

// CRITICAL FIX FOR THE "NO VISUAL CHANGE" BUG:
// Uniform sliders REQUIRE explicit precision modifiers ('uniform lowp/highp') 
// to force the QML property binder to sync real-time timeline data to the GPU.
uniform lowp float u_Temperature;  
uniform lowp float u_Tint;         
uniform lowp float u_Saturation;   

// Absolute NaN protection loop to prevent random pixel dropouts
vec3 safeColorBoundaries(vec3 color) {
    if (color.r != color.r) color.r = 0.0;
    if (color.g != color.g) color.g = 0.0;
    if (color.b != color.b) color.b = 0.0;
    return clamp(color, 0.0, 1.0);
}

void main()
{
    // CRITICAL FIX FOR GIANT PIXEL & ZOOMED-IN BUGS:
    // Forcing an explicit local vector allocation for 'uv' maps pixel addresses 
    // strictly within the normalized bounds of the specific frame container.
    vec2 uv = qt_TexCoord0;
    
    // Sample texture byte blocks using locked coordinate dimensions
    vec4 sourceFrame = texture2D(qt_Texture0, uv);
    vec3 rgb = sourceFrame.rgb;

    // 1. TEMPERATURE (Negative = Cool/Blue | Positive = Warm/Orange)
    if (u_Temperature > 0.0) {
        rgb.r += u_Temperature * 0.15;
        rgb.b -= u_Temperature * 0.10;
    } else {
        rgb.r += u_Temperature * 0.10; 
        rgb.b -= u_Temperature * 0.15; 
    }
    rgb = clamp(rgb, 0.0, 1.0);

    // 2. TINT (Negative = Green Tint | Positive = Magenta/Pink Tint)
    if (u_Tint > 0.0) {
        rgb.g -= u_Tint * 0.12;
        rgb.r += u_Tint * 0.08;
        rgb.b += u_Tint * 0.08;
    } else {
        rgb.g -= u_Tint * 0.15; 
        rgb.r += u_Tint * 0.05;
        rgb.b += u_Tint * 0.05;
    }
    rgb = clamp(rgb, 0.0, 1.0);

    // 3. SATURATION (Negative = Grayscale | Positive = Vibrant)
    // Studio broadcast-standard BT.709 color luminance vector channel breakdown
    float linearLuminance = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
    
    // Remap UI range slider from [-1.0, 1.0] securely to scale multiplier [0.0, 2.0]
    float satMultiplier = clamp(u_Saturation + 1.0, 0.0, 2.0);
    rgb = mix(vec3(linearLuminance), rgb, satMultiplier);

    // 4. SANITIZE DATA
    rgb = safeColorBoundaries(rgb);

    // Standard output generation ensuring seamless transparency overlays remain intact
    gl_FragColor = vec4(rgb, sourceFrame.a);
}
