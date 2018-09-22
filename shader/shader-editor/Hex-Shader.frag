#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

// "Hex-Shader" by EnderHDMC (aka DarkEnder, Luminous) - 2017-12-09 (original), 2018-01-01 (rewrite), 2018-09-20 (Drastic port)
// https://github.com/EnderHDMC/Shaders/

// Credit to amitp for collecting the algorithm resources into one excellent comprehensible reference
// https://www.redblobgames.com/grids/hexagons/#references

#define SIZE 20.

#define EDGE_0 0.0
#define EDGE_1 0.17
#define EDGE_TINT 0.7

/* SIZE is the side length of the hexagons in pixels.
 * Just don't make it too small or too big else it'll look weird.
 *
 * The further EDGE_0 and EDGE_1 are from each other the smoother the edges will be.
 * EDGE_0 and EDGE_1 control how thick the edges of the hexagons will be.
 * If EDGE_0 > EDGE_1 than then the hexagon will be inverted.
 *
 * EDGE_TINT is how much the how much the edge will multiplied with the hex colour.
 * 1.0 is full color, so no edge, 0.0 is a black edge,
 * > 1.0 gives border the same colour as the hex but brighter,
 * < 0.0 gives a slightly bigger black border,
 * and between 0.0 and 1.0 gives border the same colour as the hex but darker.
 */

// Required uniforms
uniform vec2 resolution;

// Neighbor struct
struct n
{
    vec2 nc;
    vec2 n30;
    vec2 n90;
    vec2 n150;
    vec2 n210;
    vec2 n270;
    vec2 n330;
};

// Forward declarations for functions that will most likey be used.
vec2 pixel_to_hex(vec2 pixel, float size);
vec2 get_hex_uv(vec2 p, vec2 res, float size);
vec2 get_hex_uv_stretch(vec2 p, vec2 res, float size);
float hexGridf(vec2 p, float size, float edge0, float edge1); // NOTE: see smoothstep() to find out what edge0 and edge1 are.
n get_n(vec2 res, float size);

void main(void)
{
    vec2 p = gl_FragCoord.xy;
    vec3 color = vec3(0.0);

    /* NOTE: the raw_uv must be calculated in the same way the hex_uv is calculated.
     * If raw_uv is calculated the following way:
     * raw_uv = (p * multipliers) / dividors + additions/subtrations;
     * then the hex_uv will be calculated as follows:
     * get_hex_uv(p, dividors * 1.0/multipliers, SIZE) + additions/subtrations;
     * where p is gl_FragCoord.xy;
     * This shader was made to be easily be mixed with other shaders, so the hex_uv is pretty much used as normal.
     */
    vec2 raw_uv = p / resolution;
    vec2 uv = get_hex_uv(p, resolution, SIZE);
    //uv = raw_uv;  // The (normal) uv (used for debugging)
    color = vec3(0.0, uv.yx);

    // The hexagon grid edges
    // The hexagon grid edges
    float grid = hexGridf(p, SIZE, EDGE_0, EDGE_1);
    color = mix(color * grid, color, EDGE_TINT);

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

n get_n(vec2 res, float size)
{
    n n;

    vec3 o = vec3(0.0);
    o.xy = get_hex_uv(vec2(1.5 * SIZE, SIZE), res, size);
    o.z = o.y * 2.0;

    n.nc   = vec2( 0.0,  0.0);

    // The neighbor at the respective angle
    n.n30  = vec2( o.x,  o.y);
    n.n90  = vec2( 0.0,  o.z);
    n.n150 = vec2(-o.x,  o.y);
    n.n210 = vec2(-o.x, -o.y);
    n.n270 = vec2( 0.0, -o.z);
    n.n330 = vec2( o.x, -o.y);

    return n;
}

vec3 axial_to_cube(vec2 hex)
{
    return vec3(hex.x, -hex.x - hex.y, hex.y);
}

vec3 cube_round(vec3 cube)
{
    vec3 rcube = vec3(round_hack(cube.x), round_hack(cube.y), round_hack(cube.z));
    vec3 diff = abs(rcube - cube);

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
     * vec2 hex = pixel_to_hex(pixel, hex_size);
     * hex.y += floor(hex.x / 2.0);
     */

    // Convert to pixel coordinates and normalise
    /*
     * NOTE: The y offset is calculated taking into account
     * the x offset / 2.0 to account for the hexagonal
     * coordinates going slightly up as it goes along.
     */

    // How many hexagons fit in the x axis and y axis
    // Note: this does not include  parts of hexagons that were cut off
    // The parts of the hexagons that were cut off need to be added on
    vec2 maxHex = vec2(pixel_to_hex(vec2(res.x, 0.0), size).x, pixel_to_hex(vec2(0.0, res.y), size).y);

    // Calculate where the right screen border cuts the hexagons
    float cutHex = (mod(res.x, 3.0*size));
    if (mod(maxHex.x, 2.0) == 0.0) {
        if (cutHex > 1.5*size) {
            cutHex = cutHex - 3.0*size;
        }
    }
    else {
        cutHex -= 1.5*size;
    }
    maxHex.x += cutHex / (1.5*size); // Add the cut part in the x axis

    // Calculate where the top screen border cuts the hexagons
    cutHex = mod(res.y + 0.5 * size * sqrt(3.0), sqrt(3.0)*size) - 0.5*sqrt(3.0) * size;
    maxHex.y += cutHex / (sqrt(3.0) * size); // Add the cut part in the y axis

    // Current hexagon
    vec2 curHex = vec2(pixel_to_hex(p, size).x, pixel_to_hex(p, size).y);
    curHex.y += 0.5*curHex.x;

    return curHex / maxHex;
}

float hex(vec2 p) {
    p.x *= 1.1547;
    p.y += mod(floor(p.x + 0.5), 2.0) * 0.5; // (p.x + 0.5) to align the grid with the hexagons
    p = abs((mod(p + 0.5, 1.0) - 0.5)); // (p + 0.5) to align the grid with the hexagons
    return abs(max(p.x * 1.5 + p.y, p.y * 2.0) - 1.0);
}

float hexGridf(vec2 p, float size, float edge0, float edge1) {
    // NOTE: sqrt(3) is equal to the length between two parralel lines in a regular hexagon
    return smoothstep(edge0, edge1, hex(p / size / sqrt(3.0)));

    // NOTE: edge0 and edge1 control how thick the edges of the hexagons will be.
    // If edge0 > edge1 than then the hexagon will be inverted.
}
