#version 330 core
in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_currentTexture;
uniform float u_time;
uniform float peaks;
uniform float amount;
uniform float speed;
uniform float phase;
float pv_peaks() { return peaks; }
float pv_amount() { return amount; }
float pv_speed() { return speed; }
float pv_phase() { return phase; }

float n_n2xvi23_value(vec2 uv) {
    return pv_phase();
}

float n_n9bwf9p_value(vec2 uv) {
    return n_n2xvi23_value(uv) / (abs(10.0) < 1e-6 ? 1e-6 : 10.0);
}

float n_n3c679w_value(vec2 uv) {
    return u_time * pv_speed();
}

float n_nw9iwwz_value(vec2 uv) {
    return n_n9bwf9p_value(uv) + n_n3c679w_value(uv);
}

float n_n9sk4fr_value(vec2 uv) {
    return pv_amount() / (abs(20.0) < 1e-6 ? 1e-6 : 20.0);
}

vec4 n_nvnabop_image(vec2 uv) {
    return texture(u_currentTexture, uv);
}

vec4 n_nnfijch_image(vec2 uv) {
    vec2 p = uv + vec2(sin(uv.y * pv_peaks() * 6.2832 + n_nw9iwwz_value(uv) * 1.0) * n_n9sk4fr_value(uv), sin(uv.x * pv_peaks() * 6.2832 + n_nw9iwwz_value(uv) * 1.0) * n_n9sk4fr_value(uv));
    return n_nvnabop_image(clamp(p, 0.0, 1.0));
}

void main() {
    fragColor = n_nnfijch_image(v_texCoord);
}
