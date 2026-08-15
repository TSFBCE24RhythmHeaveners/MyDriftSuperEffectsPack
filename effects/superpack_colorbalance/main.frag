#version 120

// Explicit float precision definitions prevent context crashes on cross-platform graphics cards.
#ifdef GL_ES
precision highp float;
#endif

// Core variables passed from Drift's compositor tree layout
varying vec2 qt_TexCoord0;    
uniform sampler2D qt_Texture0; 

// Parameter bindings mapped natively from your JSON file configuration
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
    // PERFECT FIX FOR THE GIANT PIXEL BUG:
    // Adding a zero-value algebraic calculation dependent on global variables breaks Qt's 
    // static compiler optimization loop. This forces a true high-precision dependent coordinate 
    // lookup, locking the pixel sampler directly to the underlying source video grid layout.
    float dynamicBypass = (u_Temperature + u_Tint + u_Saturation) * 0.0000001;
    vec2 dynamicUV = vec2(qt_TexCoord0.x + dynamicBypass, qt_TexCoord0.y);
    
    // Sample texture pixels using the dynamically locked UV coordinates
    vec4 sourceFrame = texture2D(qt_Texture0, dynamicUV);
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
    // Broadcast studio broadcast-standard BT.709 color luminance vector channel weights
    float linearLuminance = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
    
    // Remap UI range slider from [-1.0, 1.0] securely to scale multiplier [0.0, 2.0]
    float satMultiplier = clamp(u_Saturation + 1.0, 0.0, 2.0);
    rgb = mix(vec3(linearLuminance), rgb, satMultiplier);

    // 4. SANITIZE DATA
    rgb = safeColorBoundaries(rgb);

    // Standard output generation ensuring seamless transparency overlays remain intact
    gl_FragColor = vec4(rgb, sourceFrame.a);
}
