#version 330 core
in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_currentTexture;
uniform float u_time;
uniform float strength;
uniform float waves;
uniform float speed;
float pv_strength() { return strength; }
float pv_waves() { return waves; }
float pv_speed() { return speed; }
float pv_phase() { return phase; }

vec4 n_nvnabop_image(vec2 uv) {
    return texture(u_currentTexture, uv);
}

vec4 n_nnfijch_image(vec2 uv) {
    vec2 p = uv + vec2(sin(uv.y * pv_waves() * 6.2832 + u_time * pv_speed()) * pv_strength(), sin(uv.x * pv_waves() * 6.2832 + (pv_phase + u_time) * pv_speed()) * pv_strength());
    return n_nvnabop_image(clamp(p, 0.0, 1.0));
}

void main() {
    fragColor = n_nnfijch_image(v_texCoord);
}
