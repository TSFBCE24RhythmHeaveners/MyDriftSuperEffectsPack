#version 330 core
in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_currentTexture;
uniform float red;
uniform float green;
uniform float blue;
uniform float lvl;
float pv_red() { return red; }
float pv_green() { return green; }
float pv_blue() { return blue; }
float pv_lvl() { return lvl; }

float luma(vec4 c) { return dot(c.rgb, vec3(0.2126, 0.7152, 0.0722)); }

vec4 n_nzxw3be_image(vec2 uv) {
    return texture(u_currentTexture, uv);
}

float n_nq1k9e8_value(vec2 uv) {
    return pv_red() / (abs(255.0) < 1e-6 ? 1e-6 : 255.0);
}

float n_n8wedta_value(vec2 uv) {
    return pv_green() / (abs(255.0) < 1e-6 ? 1e-6 : 255.0);
}

float n_nip0cwx_value(vec2 uv) {
    return pv_blue() / (abs(255.0) < 1e-6 ? 1e-6 : 255.0);
}

vec4 n_nhurcjz_color(vec2 uv) {
    return vec4(n_nq1k9e8_value(uv), n_n8wedta_value(uv), n_nip0cwx_value(uv), 1.0);
}

float n_nqj1xrh_value(vec2 uv) {
    return pv_lvl() / (abs(100.0) < 1e-6 ? 1e-6 : 100.0);
}

vec4 n_nwnhr9e_image(vec2 uv) {
    vec4 col = n_nzxw3be_image(uv);
    vec3 duo = mix(vec4(0.0, 0.0, 0.0, 1.0).rgb, n_nhurcjz_color(uv).rgb, smoothstep(0.0, 1.0, luma(col)));
    return vec4(mix(col.rgb, duo, n_nqj1xrh_value(uv)), col.a);
}

void main() {
    fragColor = n_nwnhr9e_image(v_texCoord);
}
