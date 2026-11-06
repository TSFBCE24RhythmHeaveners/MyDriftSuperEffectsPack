#version 330 core
in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_currentTexture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float amount;
uniform float speed;
uniform float zoom;
float pv_amount() { return amount; }
float pv_speed() { return speed; }
float pv_zoom() { return zoom; }

mat2 rot2(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, s, -s, c);
}

vec4 n_nrzop8x_image(vec2 uv) {
    return texture(u_currentTexture, uv);
}

vec2 x_n1mgqoycmul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
vec2 x_n1mgqoycdiv(vec2 a, vec2 b) { float d = max(dot(b, b), 1e-8); return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / d; }

float n_nhjfdr6_value(vec2 uv) {
    float x = u_time * pv_speed() + 0.0;
    return mix(-1.0, 1.0, 0.5 - 0.5 * cos(x * 6.2832));
}

float n_nds1wzs_value(vec2 uv) {
    float x = u_time * pv_speed() + 0.25;
    return mix(-1.0, 1.0, 0.5 - 0.5 * cos(x * 6.2832));
}

vec2 n_nrg5yhr_p(vec2 uv) {
    return vec2(n_nhjfdr6_value(uv), n_nds1wzs_value(uv));
}

vec2 n_nvhuula_p(vec2 uv) {
    return n_nrg5yhr_p(uv) * pv_amount();
}

vec2 n_n1mgqoy_p(vec2 uv) {
    float asp = u_resolution.x / max(u_resolution.y, 1.0);
    vec2 sc = vec2(asp, -1.0) * pv_zoom();
    vec2 z = (uv - 0.5) * sc;
    vec2 w = n_nvhuula_p(uv);
    float n = 2.0;
    vec2 r = x_n1mgqoycdiv(z - w, vec2(1.0, 0.0) - x_n1mgqoycmul(vec2(w.x, -w.y), z));
    return r / sc + 0.5;
}

vec4 n_n681vrd_image(vec2 uv) {
    vec2 p = n_n1mgqoy_p(uv);
    return n_nrzop8x_image(1.0 - abs(mod(p, 2.0) - 1.0));
}

void main() {
    fragColor = n_n681vrd_image(v_texCoord);
}
