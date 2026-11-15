#version 330 core
in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_currentTexture;
uniform vec2 u_resolution;
uniform float degree;
uniform float angle;
float pv_degree() { return degree; }
float pv_angle() { return angle; }

vec4 over(vec4 top, vec4 bot) {
    float oa = top.a + bot.a * (1.0 - top.a);
    if (oa <= 0.0001) return vec4(0.0);
    vec3 rgb = (top.rgb * top.a + bot.rgb * bot.a * (1.0 - top.a)) / oa;
    return vec4(rgb, oa);
}

float n_nhdcjm8_value(vec2 uv) {
    return 1.8 / (abs(pv_degree()) < 1e-6 ? 1e-6 : pv_degree());
}

float n_nyk28t8_value(vec2 uv) {
    return pv_angle() / (abs(57.29578) < 1e-6 ? 1e-6 : 57.29578);
}

vec4 n_n1bpgag_image(vec2 uv) {
    return texture(u_currentTexture, uv);
}

vec4 n_nmnpffg_image(vec2 uv) {
    float asp = u_resolution.x / max(u_resolution.y, 1.0);
    vec2 ctr = vec2(0.5, 0.5);
    vec2 d = (uv - ctr) * vec2(asp, 1.0);
    float r = length(d);
    float fall = 1.0 - smoothstep(0.0, max(n_nhdcjm8_value(uv), 0.0001), r);
    float a = atan(d.y, d.x) + n_nyk28t8_value(uv) * fall * fall;
    vec2 nd = r > 1e-6 ? vec2(cos(a), sin(a)) * r : d;
    vec2 p = ctr + vec2(nd.x / asp, nd.y);
    if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) return vec4(0.0);
    return n_n1bpgag_image(p);
}

vec4 n_ni1736a_color(vec2 uv) {
    return vec4(0.0, 0.0, 0.0, 1.0);
}

vec4 n_np9gawy_image(vec2 uv) {
    return over(n_nmnpffg_image(uv), n_ni1736a_color(uv));
}

void main() {
    fragColor = n_np9gawy_image(v_texCoord);
}
