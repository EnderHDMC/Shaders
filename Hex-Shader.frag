#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

// "Hex-Shader" by EnderHDMC (aka DarkEnder, Luminous) - 2017-12-09 (original), 2018-01-01 (rewrite)
// https://github.com/EnderHDMC/Shaders/
// License: Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
// https://creativecommons.org/licenses/by-sa/4.0/legalcode

// Credit to amitp for collecting the algorithm resources into one excellent comprehensible reference
// https://www.redblobgames.com/grids/hexagons/#references

#define SIZE 20.

uniform vec2 resolution;
uniform vec2 touch;
uniform float time;

// Forward declarations for functions that will most likey be used.
vec2 pixel_to_hex(vec2 pixel);
vec2 get_hex_uv(vec2 p, vec2 res, float size);
vec2 get_hex_uv_stretch(vec2 p, vec2 res, float size);
float hexGridf(vec2 p, float size, float edge0, float edge1); // NOTE: see smoothstep() to find out what edge0 and edge1 are.

void main(void)
{
    vec2 p = gl_FragCoord.xy;
    vec2 t = touch.xy;
    
    vec3 color = vec3(0.0);
    
    vec2 raw_uv = p / resolution;
    vec2 uv = get_hex_uv(p, resolution, SIZE);
    vec2 tp = get_hex_uv(t, resolution, SIZE);
    //uv = raw_uv;  // The (normal) uv (used for debugging)
    color.g = uv.y;
    color.b = uv.x;
    
    // The hexagon grid edges
    color *= hexGridf(p, SIZE, 0.0, 0.17);
    
    gl_FragColor = vec4(color, 1.0);
}

float round_hack(float f)
{
    // NOTE: This is a rounding function that I hacked together since I don't have it in my version of OpenGL
    // NOTE: According to this ref-page this is already implemented in OpenGL >= 4.00
    // https://www.khronos.org/registry/OpenGL-Refpages/gl4/html/round.xhtml
    // If your version of OpenGL has the round() function then use that. It is probably faster.
    // This function is only used by the cube_round(vec3 cube) function.
    return sign(f)*floor(abs(f)+0.5);
}

/******************************************/
/**************** Hexagons ****************/
/******************************************/

vec3 axial_to_cube(vec2 hex)
{
    return vec3(hex.x, -hex.x - hex.y, hex.y);
}

vec3 cube_round(vec3 cube)
{
    vec3 rcube = vec3(round_hack(cube.x), round_hack(cube.y), round_hack(cube.z));
    vec3 diff = (abs(rcube - cube));
    
    if (diff.x > diff.y && diff.x > diff.z) {
        rcube.x = -rcube.y - rcube.z;
    }
    else if (diff.y > diff.z) {
        rcube.y = -rcube.x - rcube.z;
    }
    else {
        rcube.z = -rcube.x - rcube.y;
    }
    
    return rcube;
}

vec2 cube_to_axial(vec3 cube)
{
    return vec2(cube.x, cube.z);
}

vec2 hex_round(vec2 hex)
{
    return cube_to_axial(cube_round(axial_to_cube(hex)));
}

vec2 pixel_to_hex(vec2 pixel, float size)
{
    // NOTE: hex_round(vec2(q, r));
    return hex_round(vec2(pixel.x * 2.0 / 3.0 / size, (-pixel.x / 3.0 + sqrt(3.0) / 3.0 * pixel.y) / size));
}

vec2 get_hex_uv(vec2 p, vec2 res, float size)
{
    /*
     * Note: Depending on your purposes for testing if a pixel
     * is on a specific hexagon coordinate you may want to use
     * the pixel_to_hex directly (with the raw pixel coordinate)
     * as this function does leaves gaps between hexagons
     * Eg. According to this function the hexagons marked with y are on equal y coords
     *    _   _   _
     *  _/ \_/ \_/ \_
     * /y\_/y\_/y\_/y\
     * \_/ \_/ \_/ \_/
     *   \_/ \_/ \_/
     *
     * Where you may have wanted something like this:
     *    _   _   _
     *  _/ \_/ \_/ \_
     * /y\_/y\_/y\_/y\
     * \_/y\_/y\_/y\_/
     *   \_/ \_/ \_/
     *
     * If so then you will want to use pixel_to_hex() on the pixel coord
     * then you will need to do something like this:
     * vec2 hex = pixel_to_hex(pixel);
     * hex.y += round(hex.x / 2.0);
     */

    // Convert to pixel coordinates and normalise
    /*
     * NOTE: The y offset is calculated taking into account
     * the x offset / 2.0 to account for the hexagonal
     * coordinates going slightly up as it goes along.
     */
     
    return vec2(pixel_to_hex(p, size).x / pixel_to_hex(res, size).x,
                ((pixel_to_hex(p, size).x / 2.0) + pixel_to_hex(p, size).y) / pixel_to_hex(vec2(0.0, res.y), size).y);
}

vec2 get_hex_uv_stretch(vec2 p, vec2 res, float size)
{
    // NOTE: This does not stretch the actual hexagons.
    // It just adjusts their normalised values to cover the screen properly.
    
    vec2 uv = get_hex_uv(p, res, size);
    
    uv.x *= (res.x - size) / res.x;
    uv.x += size / 2. / res.x;
    uv.y *= (res.y - size) / res.y;
    uv.y += size / 2. / res.y;

    return uv;
}

float hex(vec2 p) {
    p.x *= 1.1547;
    p.y += mod(floor(p.x + 0.5), 2.0) * 0.5; // (p.x + 0.5) to align the grid with the hexagons
    p = abs((mod(p + 0.5, 1.0) - 0.5)); // (p + 0.5) to align the grid with the hexagons
    return abs(max(p.x * 1.5 + p.y, p.y * 2.0) - 1.0);
}

float hexGridf(vec2 p, float size, float edge0, float edge1) {
    // NOTE: sqrt(3) is equal to the length between two parralel lines in a regular hexagon
    return smoothstep(0.0, 0.17, hex(p / size / sqrt(3.0)));
    
    // NOTE: edge0 and edge1 control how thick the edges of the hexagons will be.
    // If edge0 > edge1 than then the hexagon will be inverted.
}
