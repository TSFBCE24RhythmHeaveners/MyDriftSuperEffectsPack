#version 330 core
in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_currentTexture; // pass input 0
uniform sampler2D u_fromTexture;    // outgoing clip layer
uniform sampler2D u_toTexture;      // incoming clip layer
uniform vec2 u_resolution;
uniform float u_progress;           // 0..1 across the transition window

float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
}

float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; ++i) {
        v += amp * valueNoise(p);
        p *= 2.02;
        amp *= 0.5;
    }
    return v;
}

// Straight-alpha source-over. Clip layers are transparent outside the clip rect.
vec4 over(vec4 top, vec4 bot) {
    float oa = top.a + bot.a * (1.0 - top.a);
    if (oa <= 0.0001) return vec4(0.0);
    vec3 rgb = (top.rgb * top.a + bot.rgb * bot.a * (1.0 - top.a)) / oa;
    return vec4(rgb, oa);
}

float aspectRatio() { return u_resolution.x / max(u_resolution.y, 1.0); }

uniform float sortLength;
uniform float threshold;
uniform float angle;
uniform float chromaShift;
uniform float stagger;

// A fragment shader can gather but not scatter, so this is not a sort — it walks back along the
// sort axis and keeps the brightest sample it finds. The result is monotonically non-decreasing
// in luminance along the axis, which is the property that makes a sorted run *look* sorted; what
// it does not do is preserve the histogram, since pixels are duplicated rather than permuted.
//
// The walk is spanPx/kSteps per step, so long streaks step over texels instead of visiting each
// one and run boundaries thinner than one step get crossed. Runs therefore come out somewhat
// longer than a true sort would give — which reads as sorted blocks, and suits the look.
const int kSteps = 48;

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

// The two layers crossfaded at this pixel's lane time. Walking over the composite rather than
// over each source separately keeps a single image being sorted and halves the tap count.
vec4 sourceAt(vec2 uv, float t) {
    return mix(texture(u_fromTexture, uv), texture(u_toTexture, uv), t);
}

void main() {
    vec2 uv = v_texCoord;
    vec2 px = uv * u_resolution;

    // v_texCoord.y == 0 is the top, so +y is down and the 90 degree default sorts downward.
    float rad = radians(angle);
    vec2 dir = vec2(cos(rad), sin(rad));
    vec2 perp = vec2(-dir.y, dir.x);

    // Streaks grow to the midpoint and collapse again, so p=0 and p=1 are the untouched clips.
    float envelope = sin(u_progress * 3.14159265);

    // Each 3px lane hands over at its own moment. The clamp keeps every lane's blend window
    // inside 0..1, so no lane is left part-way through the handover at either end.
    float lane = floor(dot(px, perp) / 3.0);
    float sw = clamp(0.45 + (hash11(lane) - 0.5) * stagger * 0.6, 0.15, 0.75);
    float mixT = smoothstep(sw - 0.15, sw + 0.15, u_progress);

    // Asendorf's rule: only runs brighter than the threshold sort, and a darker pixel ends a
    // run. Easing the threshold down as the streaks peak pulls more of the frame in at the
    // midpoint and lets it drain back out.
    float thr = threshold * (1.0 - 0.55 * envelope);

    float spanPx = sortLength * envelope * 0.25 * max(u_resolution.x, u_resolution.y);
    vec2 stepUv = -dir * (spanPx / float(kSteps)) / u_resolution;

    vec4 best = sourceAt(uv, mixT);
    float bestL = luma(best.rgb);
    vec2 bestUv = uv;

    if (bestL > thr && spanPx > 0.5) {
        vec2 suv = uv;
        for (int i = 0; i < kSteps; ++i) {
            suv += stepUv;
            if (suv.x < 0.0 || suv.x > 1.0 || suv.y < 0.0 || suv.y > 1.0)
                break;
            vec4 s = sourceAt(suv, mixT);
            float l = luma(s.rgb);
            if (l <= thr)
                break; // run boundary, and also the clip edge: outside is transparent black
            if (l > bestL) {
                bestL = l;
                best = s;
                bestUv = suv;
            }
        }
    }

    // Split the channels along the streak rather than across the screen: red sits at the head,
    // blue trails back toward the pixel. Collapses to nothing wherever there is no streak.
    float k = chromaShift * 0.6;
    vec4 g = sourceAt(mix(uv, bestUv, 1.0 - k * 0.5), mixT);
    vec4 b = sourceAt(mix(uv, bestUv, 1.0 - k), mixT);

    fragColor = vec4(best.r, g.g, b.b, best.a);
}
