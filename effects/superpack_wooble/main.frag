#version 330 core
in vec2 v_texCoord; out vec4 fragColor;
uniform sampler2D u_currentTexture; uniform float u_time;
uniform float amount; uniform float frequency; uniform float speed; uniform float evolution; uniform float axis; uniform bool radsmode;

void main() {
    if (amount <= 1e-5) {
        fragColor = texture(u_currentTexture, v_texCoord);
        return;
    }

    float a = clamp(amount, -10.0, 10.0) * 0.04;
    float f = clamp(frequency, 0.1, 20.0);
    float t = u_time * speed + (evolution / 10);
    if (radsmode < 0.5) {
        float bas = 10;
    } else {
        float bas = 6.2831853;
    }
    vec2 uv = v_texCoord;
    if (axis < 0.5) {
        uv.x += sin(uv.y * f * bas + t) * a;
    } else {
        uv.y += sin(uv.x * f * bas + t) * a;
    }
    fragColor = texture(u_currentTexture, clamp(uv, 0.0, 1.0));
}
