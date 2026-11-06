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

float n_n17bjbv_value(vec2 uv) {
    return pv_vphase();
}

float n_nnf70l2_value(vec2 uv) {
    return n_n17bjbv_value(uv) / (abs(10.0) < 1e-6 ? 1e-6 : 10.0);
}

float n_n66hjhh_value(vec2 uv) {
    return u_time * pv_vspeed();
}

float n_nn0u7am_value(vec2 uv) {
    return n_nnf70l2_value(uv) + n_n66hjhh_value(uv);
}

float n_nda3j9a_value(vec2 uv) {
    return pv_vamount() / (abs(40.0) < 1e-6 ? 1e-6 : 40.0);
}

float n_n87ipuk_value(vec2 uv) {
    return pv_hphase();
}

float n_n8yzwc3_value(vec2 uv) {
    return n_n87ipuk_value(uv) / (abs(10.0) < 1e-6 ? 1e-6 : 10.0);
}

float n_n42d7o6_value(vec2 uv) {
    return u_time * pv_hspeed();
}

float n_nmfqxt8_value(vec2 uv) {
    return n_n8yzwc3_value(uv) + n_n42d7o6_value(uv);
}

float n_nr6nza0_value(vec2 uv) {
    return pv_hamount() / (abs(40.0) < 1e-6 ? 1e-6 : 40.0);
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

vec4 n_n9mrmty_image(vec2 uv) {
    return texture(u_currentTexture, uv);
}

vec4 n_nb11csm_image(vec2 uv) {
    vec2 p = uv + vec2(sin(uv.y * pv_vpeaks() * 6.2832 + n_nvziqfv_value(uv) * 1.0) * n_nio00t0_value(uv), 0.0);
    return n_n9mrmty_image(clamp(p, 0.0, 1.0));
}

vec4 n_nrp71ov_image(vec2 uv) {
    vec2 p = uv + vec2(0.0, sin(uv.x * pv_hpeaks() * 6.2832 + n_nsi537h_value(uv) * 1.0) * n_nwdqr25_value(uv));
    return n_nb11csm_image(clamp(p, 0.0, 1.0));
}

vec4 n_n1c4jk6_image(vec2 uv) {
    vec2 p = uv + vec2(0.0, sin(uv.x * pv_hpeaks() * 6.2832 + n_nmfqxt8_value(uv) * 1.0) * n_nr6nza0_value(uv));
    return n_nrp71ov_image(clamp(p, 0.0, 1.0));
}

vec4 n_nm7ahwe_image(vec2 uv) {
    vec2 p = uv + vec2(sin(uv.y * pv_vpeaks() * 6.2832 + n_nn0u7am_value(uv) * 1.0) * n_nda3j9a_value(uv), 0.0);
    return n_n1c4jk6_image(clamp(p, 0.0, 1.0));
}

void main() {
    fragColor = n_nm7ahwe_image(v_texCoord);
}
