#version 330 core
in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_currentTexture;
uniform vec3 targetcolor;
uniform vec3 replacementcolor;
vec3 pv_targetcolor() { return targetcolor; }
vec3 pv_replacementcolor() { return replacementcolor; }

vec4 n_nbq18f7_color(vec2 uv) {
    return vec4(pv_targetcolor(), 1.0);
}

vec4 n_n1bpgag_image(vec2 uv) {
    return texture(u_currentTexture, uv);
}

vec4 n_nr0gk8a_color(vec2 uv) {
    return vec4(pv_replacementcolor(), 1.0);
}

vec4 n_nyj1l7g_image(vec2 uv) {
    vec4 col = n_n1bpgag_image(uv);
    float dist = distance(col.rgb, n_nbq18f7_color(uv).rgb);
    float m = 1.0 - smoothstep(0.025, 0.025 + 0.1 + 0.0001, dist);
    vec3 moved = clamp(col.rgb - n_nbq18f7_color(uv).rgb + n_nr0gk8a_color(uv).rgb, 0.0, 1.0);
    return vec4(mix(col.rgb, moved, m), col.a);
}

void main() {
    fragColor = n_nyj1l7g_image(v_texCoord);
}
