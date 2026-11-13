#version 330 core
in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_currentTexture;
uniform float u_time;
uniform float peaks;
uniform float amplitude;
uniform float speed;
uniform float phase;
uniform float vertical;
float pv_peaks() { return peaks; }
float pv_amplitude() { return amplitude; }
float pv_speed() { return speed; }
float pv_phase() { return phase; }
float pv_vertical() { return vertical; }

float n_np7y0mz_value(vec2 uv) {
    return u_time * pv_speed();
}

float n_n3zncmh_value(vec2 uv) {
    return pv_phase();
}

float n_n75fey0_value(vec2 uv) {
    return n_n3zncmh_value(uv) / (abs(10.0) < 1e-6 ? 1e-6 : 10.0);
}

float n_nkf8cwz_value(vec2 uv) {
    return n_np7y0mz_value(uv) + n_n75fey0_value(uv);
}

float n_nyolo4h_value(vec2 uv) {
    return n_nkf8cwz_value(uv) * 0.628319;
}

float n_n0ly3v0_value(vec2 uv) {
    return pv_peaks();
}

float n_npe7jko_value(vec2 uv) {
    return pv_amplitude();
}

float n_nl6xa3m_value(vec2 uv) {
    return n_npe7jko_value(uv) / (abs(1000.0) < 1e-6 ? 1e-6 : 1000.0);
}

vec4 n_nzxw3be_image(vec2 uv) {
    return texture(u_currentTexture, uv);
}

vec4 n_nn09h61_image(vec2 uv) {
    vec2 p = uv + vec2(0.0, sin(uv.x * n_n0ly3v0_value(uv) * 6.2832 + n_nyolo4h_value(uv) * 1.0) * n_nl6xa3m_value(uv));
    return n_nzxw3be_image(clamp(p, 0.0, 1.0));
}

vec4 n_ni65upo_image(vec2 uv) {
    vec2 p = uv + vec2(sin(uv.y * n_n0ly3v0_value(uv) * 6.2832 + n_nyolo4h_value(uv) * 1.0) * n_nl6xa3m_value(uv), 0.0);
    return n_nzxw3be_image(clamp(p, 0.0, 1.0));
}

float n_n3rzkzb_value(vec2 uv) {
    return pv_vertical() > 0.5 ? 1.0 : 0.0;
}

vec4 n_nn9jw6f_image(vec2 uv) {
    return mix(n_nn09h61_image(uv), n_ni65upo_image(uv), clamp(n_n3rzkzb_value(uv), 0.0, 1.0));
}

void main() {
    fragColor = n_nn9jw6f_image(v_texCoord);
}
