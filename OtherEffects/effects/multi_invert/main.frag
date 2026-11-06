#version 330 core
in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_currentTexture;
uniform float redinvert;
uniform float greeninvert;
uniform float blueinvert;
uniform float hueinvert;
uniform float uvswap;
uniform float hueshift;
float pv_redinvert() { return redinvert; }
float pv_greeninvert() { return greeninvert; }
float pv_blueinvert() { return blueinvert; }
float pv_hueinvert() { return hueinvert; }
float pv_uvswap() { return uvswap; }
float pv_hueshift() { return hueshift; }

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec3 p = abs(fract(c.xxx + vec3(1.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}

float luma(vec4 c) { return dot(c.rgb, vec3(0.2126, 0.7152, 0.0722)); }

vec4 n_n84jlai_image(vec2 uv) {
    return texture(u_currentTexture, uv);
}

float n_n7t3fru_value(vec2 uv) {
    return pv_hueshift();
}

float n_nsfzz6f_value(vec2 uv) {
    return n_n7t3fru_value(uv) * 120.0;
}

vec4 n_n0tgw71_image(vec2 uv) {
    vec4 col = n_n84jlai_image(uv);
    vec3 hsv = rgb2hsv(col.rgb);
    hsv.x = fract(hsv.x + n_nsfzz6f_value(uv) / 360.0);
    return vec4(hsv2rgb(hsv), col.a);
}

vec4 n_n9hxbwp_image(vec2 uv) {
    return texture(u_currentTexture, uv);
}

vec4 n_na77taz_image(vec2 uv) {
    vec4 col = n_n9hxbwp_image(uv);
    vec3 rgb = mix(vec3(luma(col)), col.rgb, -1.0);
    return vec4(clamp(rgb, 0.0, 1.0), col.a);
}

vec4 n_nup2s6p_image(vec2 uv) {
    vec4 b = n_n0tgw71_image(uv);
    vec4 l = n_na77taz_image(uv);
    vec3 rgb = l.rgb;
    return vec4(mix(b.rgb, rgb, clamp(pv_uvswap() * l.a, 0.0, 1.0)), b.a);
}

vec4 n_nue04kv_image(vec2 uv) {
    return texture(u_currentTexture, uv);
}

vec4 n_nqfe61r_image(vec2 uv) {
    vec4 col = n_nue04kv_image(uv);
    vec3 rgb = vec3(
        dot(col.rgb, vec3(0.0, 0.0, 1.0)),
        dot(col.rgb, vec3(0.0, 1.0, 0.0)),
        dot(col.rgb, vec3(1.0, 0.0, 0.0)));
    return vec4(clamp(rgb, 0.0, 1.0), col.a);
}

vec4 n_ndsdatc_image(vec2 uv) {
    vec4 b = n_nup2s6p_image(uv);
    vec4 l = n_nqfe61r_image(uv);
    vec3 rgb = l.rgb;
    return vec4(mix(b.rgb, rgb, clamp(pv_hueinvert() * l.a, 0.0, 1.0)), b.a);
}

vec4 n_nx4bpg6_color(vec2 uv) {
    return vec4(1.0, 0.0, 0.0, 1.0);
}

vec4 n_njcg9du_image(vec2 uv) {
    vec4 b = n_ndsdatc_image(uv);
    vec4 l = n_nx4bpg6_color(uv);
    vec3 rgb = abs(b.rgb - l.rgb);
    return vec4(mix(b.rgb, rgb, clamp(pv_redinvert() * l.a, 0.0, 1.0)), b.a);
}

vec4 n_n012b1j_color(vec2 uv) {
    return vec4(0.0, 1.0, 0.0, 1.0);
}

vec4 n_njy49xb_image(vec2 uv) {
    vec4 b = n_njcg9du_image(uv);
    vec4 l = n_n012b1j_color(uv);
    vec3 rgb = abs(b.rgb - l.rgb);
    return vec4(mix(b.rgb, rgb, clamp(pv_greeninvert() * l.a, 0.0, 1.0)), b.a);
}

vec4 n_nsf59i7_color(vec2 uv) {
    return vec4(0.0, 0.0, 1.0, 1.0);
}

vec4 n_n1w28qh_image(vec2 uv) {
    vec4 b = n_njy49xb_image(uv);
    vec4 l = n_nsf59i7_color(uv);
    vec3 rgb = abs(b.rgb - l.rgb);
    return vec4(mix(b.rgb, rgb, clamp(pv_blueinvert() * l.a, 0.0, 1.0)), b.a);
}

void main() {
    fragColor = n_n1w28qh_image(v_texCoord);
}
