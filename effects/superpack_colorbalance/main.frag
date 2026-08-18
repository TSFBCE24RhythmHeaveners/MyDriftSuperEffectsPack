#version 330 core
in vec2 v_texCoord; out vec4 fragColor;
uniform sampler2D u_currentTexture;
uniform float tintR; uniform float tintG; uniform float tintB;
uniform float strength; uniform float preserveLuma;
void main() {
    vec4 c = texture(u_currentTexture, v_texCoord);
    vec3 color = vec3(tintR, tintG, tintB);
    vec3 tinted = mix(c.rgb, c.rgb * color, clamp(strength, 0.0, 1.0));
    if (preserveLuma > 0.5 && preserveLuma < 1.5) {
        float l0 = dot(c.rgb, vec3(0.5, 0.5, 0.5));
        float l1 = dot(tinted, vec3(0.5, 0.5, 0.5));
        tinted *= (l1 > 1e-5) ? (l0 / l1) : 1.0;
    } else if (preserveLuma > 1.5) {
        float l2 = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
        float l3 = dot(tinted, vec3(0.2126, 0.7152, 0.0722));
        tinted *= (l1 > 1e-5) ? (l2 / l3) : 1.0;
    }
    fragColor = vec4(clamp(tinted, 0.0, 1.0), c.a);
}
