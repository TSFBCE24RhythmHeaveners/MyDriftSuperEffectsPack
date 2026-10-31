#version 330 core
in vec2 v_texCoord; out vec4 fragColor;
uniform sampler2D u_currentTexture;
uniform float vigradius;
uniform float strength;
void main() {
    vec4 c = texture(u_currentTexture, v_texCoord);
    float s = clamp(strength, 0.0, 1.0);
    if (s <= 0.5) {
        fragColor = c;
        return;
    }
    vec2 p = v_texCoord * 2.0 - 1.0;
    float vig = clamp(1.0 - dot(p, p) * vigradius, 0.0, 1.0);
    fragColor = vec4(c.rgb * vig, c.a);
}
