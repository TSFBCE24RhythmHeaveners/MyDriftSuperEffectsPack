#version 330 core
in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_currentTexture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float lsync;
uniform float slices;
uniform float changesPerSecond;
uniform float lsphase;
uniform float tiltsync;
uniform float split;
uniform float angle;
uniform float noise;
uniform float phosphorescence;
uniform float scanphasing;
uniform float scanspeed;
uniform float darkness;
uniform float lines;
uniform float rollSpeed;
float pv_lsync() { return lsync; }
float pv_slices() { return slices; }
float pv_changesPerSecond() { return changesPerSecond; }
float pv_lsphase() { return lsphase; }
float pv_tiltsync() { return tiltsync; }
float pv_split() { return split; }
float pv_angle() { return angle; }
float pv_noise() { return noise; }
float pv_phosphorescence() { return phosphorescence; }
float pv_scanphasing() { return scanphasing; }
float pv_scanspeed() { return scanspeed; }
float pv_darkness() { return darkness; }
float pv_lines() { return lines; }
float pv_rollSpeed() { return rollSpeed; }

vec3 blendOverlay(vec3 b, vec3 l) {
    return mix(2.0 * b * l, 1.0 - 2.0 * (1.0 - b) * (1.0 - l), step(0.5, b));
}

vec3 blendSoftLight(vec3 b, vec3 l) {
    return mix(2.0 * b * l + b * b * (1.0 - 2.0 * l), sqrt(b) * (2.0 * l - 1.0) + 2.0 * b * (1.0 - l), step(0.5, l));
}

float luma(vec4 c) { return dot(c.rgb, vec3(0.2126, 0.7152, 0.0722)); }

float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

vec4 x_nsqe32z_grad(float t) {
    if (t <= 0.0) return vec4(0.498039, 0.0, 0.0, 1.0);
    if (t < 1.0) return mix(vec4(0.498039, 0.0, 0.0, 1.0), vec4(0.501961, 0.0, 0.0, 1.0), (t - 0.0) / 1.0);
    return vec4(0.501961, 0.0, 0.0, 1.0);
}

float n_nn4gayv_mask(vec2 uv) {
    float asp = u_resolution.x / max(u_resolution.y, 1.0);
    vec2 q = floor(uv * vec2(asp, 1.0) * 400.0 / asp);
    return mod(q.x + q.y, 2.0);
}

vec4 n_nsqe32z_image(vec2 uv) {
    vec4 col = vec4(vec3(n_nn4gayv_mask(uv)), 1.0);
    float t = clamp(luma(col), 0.0, 1.0);
    vec4 g = x_nsqe32z_grad(t);
    return vec4(mix(col.rgb, g.rgb, 1.0 * g.a), col.a);
}

float n_nhwxfjo_value(vec2 uv) {
    return u_time * pv_tiltsync();
}

vec4 n_n5qsvir_image(vec2 uv) {
    return texture(u_currentTexture, uv);
}

vec4 n_np30cfz_image(vec2 uv) {
    float tick = floor(u_time * pv_changesPerSecond()) + pv_lsphase() * 31.7;
    float row = floor(uv.y * pv_slices());
    float h = hash21(vec2(row, tick));
    float on = step(1.0 - pv_lsync() * 0.6, h);
    float shift = (hash21(vec2(tick, row * 1.7)) - 0.5) * 0.25 * pv_lsync() * on;
    vec2 p = vec2(fract(uv.x + shift), uv.y);
    vec4 g = n_n5qsvir_image(p);
    float r = n_n5qsvir_image(vec2(fract(p.x + shift * 0.3), p.y)).r;
    float b = n_n5qsvir_image(vec2(fract(p.x - shift * 0.3), p.y)).b;
    return vec4(r, g.g, b, g.a);
}

vec4 n_nx4u7ck_image(vec2 uv) {
    vec2 p = uv + (n_nsqe32z_image(uv).rg - 0.5) * 2.0 * n_nhwxfjo_value(uv);
    return n_np30cfz_image(fract(p));
}

float n_nnzbren_random(vec2 uv) {
    vec2 n = max(floor(vec2(64.0, 64.0)), vec2(1.0));
    vec2 id = floor(uv * n);
    return hash21(id + 0.0 * 1.31);
}

vec4 n_n1gnnb2_image(vec2 uv) {
    vec4 b = n_nx4u7ck_image(uv);
    vec4 l = vec4(vec3(n_nnzbren_random(uv)), 1.0);
    vec3 rgb = blendOverlay(b.rgb, l.rgb);
    return vec4(mix(b.rgb, rgb, clamp(pv_noise() * l.a, 0.0, 1.0)), b.a);
}

vec4 n_noot5ii_image(vec2 uv) {
    float a = radians(pv_angle());
    vec2 delta = vec2(cos(a), sin(a)) * pv_split() / u_resolution;
    vec4 g = n_n1gnnb2_image(uv);
    float r = n_n1gnnb2_image(clamp(uv + delta, 0.0, 1.0)).r;
    float b = n_n1gnnb2_image(clamp(uv - delta, 0.0, 1.0)).b;
    return vec4(r, g.g, b, g.a);
}

vec4 n_nfgjhr2_color(vec2 uv) {
    return vec4(0.501961, 1.0, 1.0, 1.0);
}

vec4 n_naeg77d_image(vec2 uv) {
    vec4 b = n_noot5ii_image(uv);
    vec4 l = n_nfgjhr2_color(uv);
    vec3 rgb = blendOverlay(b.rgb, l.rgb);
    return vec4(mix(b.rgb, rgb, clamp(pv_phosphorescence() * l.a, 0.0, 1.0)), b.a);
}

vec4 n_nf2nd4d_image(vec2 uv) {
    vec4 col = n_naeg77d_image(uv);
    float l = 0.5 + 0.5 * sin((uv.y + u_time * pv_rollSpeed() * 0.05) * pv_lines() * 3.14159);
    return vec4(col.rgb * (1.0 - pv_darkness() * (1.0 - l)), col.a);
}

float n_n5490uw_value(vec2 uv) {
    return pv_scanphasing();
}

float n_n5erlxa_value(vec2 uv) {
    return n_n5490uw_value(uv) / (abs(2.0) < 1e-6 ? 1e-6 : 2.0);
}

float n_nlftj7d_value(vec2 uv) {
    return n_n5490uw_value(uv) / (abs(4.0) < 1e-6 ? 1e-6 : 4.0);
}

float n_nijwa8x_mask(vec2 uv) {
    float ang = radians(90.0);
    float x = dot(uv - 0.5, vec2(cos(ang), sin(ang))) * 1.0 + u_time * pv_scanspeed();
    float f = abs(fract(x) - 0.5) * 2.0;
    float soft = max(n_n5erlxa_value(uv), 0.0005);
    return 1.0 - smoothstep(n_nlftj7d_value(uv) - soft, n_nlftj7d_value(uv) + soft, f);
}

vec4 n_nowbfiq_image(vec2 uv) {
    vec4 b = n_nf2nd4d_image(uv);
    vec4 l = vec4(vec3(n_nijwa8x_mask(uv)), 1.0);
    vec3 rgb = 1.0 - (1.0 - b.rgb) * (1.0 - l.rgb);
    return vec4(mix(b.rgb, rgb, clamp(1.0 * l.a, 0.0, 1.0)), b.a);
}

void main() {
    fragColor = n_nowbfiq_image(v_texCoord);
}
