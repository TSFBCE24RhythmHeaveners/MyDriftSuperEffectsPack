#version 330 core
in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_currentTexture;
uniform vec2 u_resolution;      // provided by Drift
uniform vec2 u_direction;       // set per-pass (e.g. (1,0) and (0,1)). If zero, fallback 3x3 runs.

uniform float strength;         // common parameter name
uniform float Strength;         // alternate capitalized name
uniform float u_strength;       // engine-prefixed alternative

// Pick the user-provided value (whichever is present). If none are set, default will be 0.
float getUserStrength()
{
    // Note: uniforms that are not set by the host simply remain at their default (0.0).
    float s1 = strength;
    float s2 = Strength;
    float s3 = u_strength;
    float s = max(max(s1, s2), s3);
    return clamp(s, 0.0, 999999.0);
}

void main()
{
    // Safety: if resolution is invalid, passthrough
    if (u_resolution.x <= 0.0 || u_resolution.y <= 0.0) {
        fragColor = texture(u_currentTexture, v_texCoord);
        return;
    }

    // texel (UV) size for one pixel
    vec2 texel = 1.0 / u_resolution;

    float userStrength = getUserStrength();
    // Map 0..100 -> 0..10 px radius (keeps sample counts reasonable). Adjust multiplier if you want stronger blur.
    float radiusPx = clamp(userStrength * 10, 0.0, 10.0);

    // Very small strength -> passthrough
    if (radiusPx < 0.5) {
        fragColor = texture(u_currentTexture, v_texCoord);
        return;
    }

    // If a direction is provided (non-zero), perform a 1D box blur along that direction.
    // This is the intended, optimized separable mode: call shader twice with u_direction=(1,0) then (0,1).
    if (length(u_direction) > 0.0001) {
        vec2 dir = normalize(u_direction) * texel; // offset per 1-pixel in UV-space along direction
        int r = int(floor(radiusPx + 0.5));       // integer radius in pixels
        r = clamp(r, 1, 20);                      // clamp loop size to protect against very large loops
        float invCount = 1.0 / float(2 * r + 1);

        vec4 sum = vec4(0.0);
        // unroll-friendly loop bounds: safe constant extremes, but skip outside desired range
        for (int i = -20; i <= 20; ++i) {
            if (i < -r || i > r) continue;
            vec2 sampleUV = v_texCoord + float(i) * dir;
            // clamp UV so edges are sampled consistently and we don't sample outside 0..1
            sampleUV = clamp(sampleUV, vec2(0.0), vec2(1.0));
            sum += texture(u_currentTexture, sampleUV);
        }

        fragColor = sum * invCount;
        return;
    }

    // Fallback: if u_direction is zero (pipeline didn't set separable passes), do a cheap 3x3 box blur so there's at least some visible effect.
    // This avoids "no visual change" when the effect was accidentally run only once.
    {
        vec2 d = texel;
        vec4 c = vec4(0.0);
        for (int y = -1; y <= 1; ++y) {
            for (int x = -1; x <= 1; ++x) {
                vec2 sampleUV = v_texCoord + vec2(float(x), float(y)) * d;
                sampleUV = clamp(sampleUV, vec2(0.0), vec2(1.0));
                c += texture(u_currentTexture, sampleUV);
            }
        }
        fragColor = c / 9.0;
    }
}
