// DO NOT ADD A #VERSION TAG HERE. Drift will prepend its own version header automatically.
// Adding a version tag crashes the internal compiler header-stitching macro!

#ifdef GL_ES
precision highp float;
#endif

// Variables provided natively by the Drift compositor pipeline 
// (Do not alter these names; they are mapped directly to the timeline resolution)
varying vec2 qt_TexCoord0;    
uniform sampler2D qt_Texture0; 

// CRITICAL FIX FOR THE "NO VISUAL CHANGE" BUG:
// Uniform definitions MUST utilize the native 'lowp' specifier to force 
// Drift's property binder to dynamically pipe your live track slider data.
uniform lowp float u_temperature;  
uniform lowp float u_tint;         
uniform lowp float u_saturation;   

// Absolute NaN protection loop to prevent random black pixel dropouts
vec3 safeColorBoundaries(vec3 color) {
    if (color.r != color.r) color.r = 0.0;
    if (color.g != color.g) color.g = 0.0;
    if (color.b != color.b) color.b = 0.0;
    return clamp(color, 0.0, 1.0);
}

void main()
{
    // SOLID FIX FOR THE GIANT PIXEL & ZOOMED-IN BUGS:
    // We isolate and map the texture sampler directly onto Drift's native 
    // timeline layout vector. Do not attempt manual pixel offsets here.
    vec2 uv = qt_TexCoord0;
    
    // Sample texture pixels using perfectly aligned frame coordinates
    vec4 sourceFrame = texture2D(qt_Texture0, uv);
    vec3 rgb = sourceFrame.rgb;

    // 1. TEMPERATURE (Negative = Cool/Blue | Positive = Warm/Orange)
    if (u_temperature > 0.0) {
        rgb.r += u_temperature * 0.15;
        rgb.b -= u_temperature * 0.10;
    } else {
        rgb.r += u_temperature * 0.10; 
        rgb.b -= u_temperature * 0.15; 
    }
    rgb = clamp(rgb, 0.0, 1.0);

    // 2. TINT (Negative = Green Tint | Positive = Magenta/Pink Tint)
    if (u_tint > 0.0) {
        rgb.g -= u_tint * 0.12;
        rgb.r += u_tint * 0.08;
        rgb.b += u_tint * 0.08;
    } else {
        rgb.g -= u_tint * 0.15; // Subtracting a negative increases green
        rgb.r += u_tint * 0.05;
        rgb.b += u_tint * 0.05;
    }
    rgb = clamp(rgb, 0.0, 1.0);

    // 3. SATURATION (Negative = Grayscale | Positive = Vibrant)
    // Broadcast studio broadcast-standard BT.709 color luminance vector channel weights
    float linearLuminance = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
    
    // Remap UI range slider from [-1.0, 1.0] securely to scale multiplier [0.0, 2.0]
    float satMultiplier = clamp(u_saturation + 1.0, 0.0, 2.0);
    rgb = mix(vec3(linearLuminance), rgb, satMultiplier);

    // 4. SANITIZE DATA
    rgb = safeColorBoundaries(rgb);

    // Standard output generation ensuring seamless transparency overlays remain intact
    gl_FragColor = vec4(rgb, sourceFrame.a);
}
