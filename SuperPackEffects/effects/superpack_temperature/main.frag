#version 330 core
in vec2 v_texCoord; out vec4 fragColor;
uniform sampler2D u_currentTexture; uniform float temperature; uniform float tint;
void main() {
    vec4 c = texture(u_currentTexture, v_texCoord);
    float t = (temperature - 5000.0) / 3500.0; // -1..~1
    vec3 warm = vec3(0.15, 0.05, -0.15) * t;
    vec3 gain = vec3(1.0 + tint * 0.18, 1.0 - tint * 0.22, 1.0 + tint * 0.18);
    fragColor = vec4(clamp(c.rgb * gain + warm, 0.0, 1.0), c.a);
}
