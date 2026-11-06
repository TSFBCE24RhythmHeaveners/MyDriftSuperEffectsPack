#version 330 core
in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_currentTexture;
uniform float value;
float pv_value() { return value; }

float luma(vec4 c) { return dot(c.rgb, vec3(0.2126, 0.7152, 0.0722)); }

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

vec4 n_nlphsoy_image(vec2 uv) {
    return texture(u_currentTexture, uv);
}

vec4 n_neomp47_image(vec2 uv) {
    vec4 col = n_nlphsoy_image(uv);
    vec3 rgb = mix(vec3(luma(col)), col.rgb, 0.125);
    return vec4(clamp(rgb, 0.0, 1.0), col.a);
}

float n_nr5vnkb_value(vec2 uv) {
    return pv_value();
}

vec4 n_npqnliv_image(vec2 uv) {
    vec4 col = n_neomp47_image(uv);
    vec3 hsv = rgb2hsv(col.rgb);
    hsv.x = fract(hsv.x + n_nr5vnkb_value(uv) / 360.0);
    return vec4(hsv2rgb(hsv), col.a);
}

vec4 n_n00kzif_image(vec2 uv) {
    vec4 col = n_npqnliv_image(uv);
    vec3 rgb = mix(vec3(luma(col)), col.rgb, 8.0);
    return vec4(clamp(rgb, 0.0, 1.0), col.a);
}

void main() {
    fragColor = n_n00kzif_image(v_texCoord);
}
