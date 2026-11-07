#version 330 core
in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_currentTexture;
uniform float u_time;
uniform float vpeaks;
uniform float vamount;
uniform float vspeed;
uniform float vphase;
uniform float hpeaks;
uniform float hamount;
uniform float hspeed;
uniform float hphase;
float pv_vpeaks() { return vpeaks; }
float pv_vamount() { return vamount; }
float pv_vspeed() { return vspeed; }
float pv_vphase() { return vphase; }
float pv_hpeaks() { return hpeaks; }
float pv_hamount() { return hamount; }
float pv_hspeed() { return hspeed; }
float pv_hphase() { return hphase; }

float n_nmdw1f4_value(vec2 uv) {
    return pv_vphase();
}

float n_n5s9yli_value(vec2 uv) {
    return n_nmdw1f4_value(uv) / (abs(10.0) < 1e-6 ? 1e-6 : 10.0);
}

float n_nrjipir_value(vec2 uv) {
    return u_time * pv_vspeed();
}

float n_nl2li9z_value(vec2 uv) {
    return n_n5s9yli_value(uv) + n_nrjipir_value(uv);
}

float n_n51zkul_value(vec2 uv) {
    return pv_vamount() / (abs(40.0) < 1e-6 ? 1e-6 : 40.0);
}

float n_n6mahi8_value(vec2 uv) {
    return n_n51zkul_value(uv) / (abs(1.25) < 1e-6 ? 1e-6 : 1.25);
}

float n_nf3wo81_value(vec2 uv) {
    return pv_hphase();
}

float n_nm4a11z_value(vec2 uv) {
    return n_nf3wo81_value(uv) / (abs(10.0) < 1e-6 ? 1e-6 : 10.0);
}

float n_nzqfw0j_value(vec2 uv) {
    return u_time * pv_hspeed();
}

float n_n1zknoh_value(vec2 uv) {
    return n_nm4a11z_value(uv) + n_nzqfw0j_value(uv);
}

float n_nmqvbx9_value(vec2 uv) {
    return pv_hamount() / (abs(40.0) < 1e-6 ? 1e-6 : 40.0);
}

float n_ng53jcw_value(vec2 uv) {
    return n_nmqvbx9_value(uv) / (abs(1.25) < 1e-6 ? 1e-6 : 1.25);
}

float n_nwjc5y5_value(vec2 uv) {
    return pv_hphase();
}

float n_nkv5ikb_value(vec2 uv) {
    return n_nwjc5y5_value(uv) / (abs(10.0) < 1e-6 ? 1e-6 : 10.0);
}

float n_nceam0w_value(vec2 uv) {
    return u_time * pv_hspeed();
}

float n_nsi537h_value(vec2 uv) {
    return n_nkv5ikb_value(uv) + n_nceam0w_value(uv);
}

float n_nwdqr25_value(vec2 uv) {
    return pv_hamount() / (abs(40.0) < 1e-6 ? 1e-6 : 40.0);
}

float n_nolfl4b_value(vec2 uv) {
    return n_nwdqr25_value(uv) / (abs(1.25) < 1e-6 ? 1e-6 : 1.25);
}

float n_nip3m32_value(vec2 uv) {
    return pv_vphase();
}

float n_ndjmqt8_value(vec2 uv) {
    return n_nip3m32_value(uv) / (abs(10.0) < 1e-6 ? 1e-6 : 10.0);
}

float n_naejm9y_value(vec2 uv) {
    return u_time * pv_vspeed();
}

float n_nvziqfv_value(vec2 uv) {
    return n_ndjmqt8_value(uv) + n_naejm9y_value(uv);
}

float n_nio00t0_value(vec2 uv) {
    return pv_vamount() / (abs(40.0) < 1e-6 ? 1e-6 : 40.0);
}

float n_n44fmzu_value(vec2 uv) {
    return n_nio00t0_value(uv) / (abs(1.25) < 1e-6 ? 1e-6 : 1.25);
}

vec4 n_n9mrmty_image(vec2 uv) {
    return texture(u_currentTexture, uv);
}

vec4 n_nb11csm_image(vec2 uv) {
    vec2 p = uv + vec2(sin(uv.y * pv_vpeaks() * 6.2832 + n_nvziqfv_value(uv) * 1.0) * n_n44fmzu_value(uv), 0.0);
    return n_n9mrmty_image(clamp(p, 0.0, 1.0));
}

vec4 n_nrp71ov_image(vec2 uv) {
    vec2 p = uv + vec2(0.0, sin(uv.x * pv_hpeaks() * 6.2832 + n_nsi537h_value(uv) * 1.0) * n_nolfl4b_value(uv));
    return n_nb11csm_image(clamp(p, 0.0, 1.0));
}

vec4 n_ncrc0pu_image(vec2 uv) {
    vec2 p = uv + vec2(0.0, sin(uv.x * pv_hpeaks() * 6.2832 + n_n1zknoh_value(uv) * 1.0) * n_ng53jcw_value(uv));
    return n_nrp71ov_image(clamp(p, 0.0, 1.0));
}

vec4 n_nkz0e91_image(vec2 uv) {
    vec2 p = uv + vec2(sin(uv.y * pv_vpeaks() * 6.2832 + n_nl2li9z_value(uv) * 1.0) * n_n6mahi8_value(uv), 0.0);
    return n_ncrc0pu_image(clamp(p, 0.0, 1.0));
}

void main() {
    fragColor = n_nkz0e91_image(v_texCoord);
}
