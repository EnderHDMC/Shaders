#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

// "Hex-Shader" by EnderHDMC (aka DarkEnder, Luminous) - 2017-12-09
// https://github.com/EnderHDMC/Shaders/
// License: Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
// https://creativecommons.org/licenses/by-sa/4.0/legalcode

// Credit to amitp for collecting the algorithm resources into one excellent comprehensible reference
// https://www.redblobgames.com/grids/hexagons/#references

#define SIZE 20.
#define STRETCH false

uniform vec2 resolution;
uniform vec2 touch;
uniform float time;

vec2 pixel_to_hex(vec2 pixel);
vec2 get_hex_uv(vec2 p, vec2 res);
float round(float f);

// TODO: Add more notes about the code and algorithms to better explain it

void main(void) {
	vec2 p = gl_FragCoord.xy;
	vec2 t = touch.xy;

	vec3 color = vec3(0.0);
	//color = vec3(0.2088, 0.3066, 0.4088);

	vec2 raw_uv = p / resolution;
	vec2 uv = get_hex_uv(p, resolution);
	vec2 tp = get_hex_uv(t, resolution);
	//uv.y += round((uv.x) / 2.0);
	//tp.y += round((tp.x) / 2.0);
	//uv = p / resolution;
	color.g = uv.y;
	color.b = uv.x;

	gl_FragColor = vec4(color, 1.0);
}

float round(float f)
{
	// NOTE: According to this ref-page this is already implemented in OpenGL >= 4.00
	// https://www.khronos.org/registry/OpenGL-Refpages/gl4/html/round.xhtml
	// Don't know if this will cause problems for re-definitions as I don't have OpenGL >= 4.00 so cannot test.
	// I'm guessing it will though so I'm leaving this note here.
	return floor(f) + step(0.5, fract(f));
}

vec3 axial_to_cube(vec2 hex)
{
	vec3 cube = vec3(hex.x, 0.0, hex.y);
	cube.y = -cube.x - cube.z;
	return cube;
}

vec3 cube_round(vec3 cube)
{
	float rx = round(cube.x);
	float ry = round(cube.y);
	float rz = round(cube.z);

	float x_diff = abs(rx - cube.x);
	float y_diff = abs(ry - cube.y);
	float z_diff = abs(rz - cube.z);

	if (x_diff > y_diff && x_diff > z_diff)
	{
		rx = -ry-rz;
	} else if (y_diff > z_diff)
	{
		ry = -rx-rz;
	} else
	{
		rz = -rx-ry;
	}
	
	return vec3(rx, ry, rz);
}

vec2 cube_to_axial(vec3 cube){
	vec2 hex = vec2(cube.x, cube.z);
	return hex;
}

vec2 hex_round(vec2 hex)
{
	return cube_to_axial(cube_round(axial_to_cube(hex)));
}

vec2 pixel_to_hex(vec2 pixel)
{
	float q = pixel.x * 2.0 / 3.0 / SIZE;
	float r = (-pixel.x / 3.0 + sqrt(3.0)/3.0 * pixel.y) / SIZE;
	return hex_round(vec2(q, r));
}

vec2 get_hex_uv(vec2 p, vec2 res)
{
	/*
	 *	Note: Depending on your purposes for testing if a pixel
	 *				is on a specific hexagon coordinate you may want to use
	 *				the pixel_to_hex directly (with the raw pixel coordinate)
	 *				as this (get_hex_uv) function leaves gaps between hexagons
	 *				Eg. According to this function the hexagons marked with y are on equal y coords
	 *             _   _   _
	 *           _/ \_/ \_/ \_
	 *          /y\_/y\_/y\_/y\
	 *          \_/ \_/ \_/ \_/
	 *            \_/ \_/ \_/
	 *
	 *				Where you may have wanted something like this
	 *             _   _   _
	 *           _/ \_/ \_/ \_
	 *          /y\_/y\_/y\_/y\
	 *          \_/y\_/y\_/y\_/
	 *            \_/ \_/ \_/
	 *
	 *				If so then you will want to use pixel_to_hex on the pixel coord
	 *				so you will need to do something like this:
	 *				vec2 hex = pixel_to_hex(pixel);
	 *				hex.y += round(hex.x / 2.0);
	 *        
	 *        Just remember that when you compare this the value will not be normalized
	 */

	// Convert to pixel coordinates and normalize
	/*
	 *	NOTE: The y offset is calculated taking into account
	 *				the x offset / 2.0 to account for the hexagonal
	 *				coordinates going slightly up as it goes along
	 */
	vec2 uv = vec2(pixel_to_hex(p).x / pixel_to_hex(res).x,
		((pixel_to_hex(p).x / 2.0) + pixel_to_hex(p).y) / pixel_to_hex(vec2(0.0, res.y)).y);

	if (STRETCH)
	{
		// Stretch the uv onto the screen so that there will be no artifacts on the edges
		// The artifacts are caused by negative coords on the top and left of the screen
		// this can be rather undesirable for wrapping textures that aren't seamless

		// TODO: Check if this actually stretches the shape of the hexagon
		uv.x *= (resolution.x - SIZE) / resolution.x;
		uv.x += SIZE / 2. / resolution.x;
		uv.y *= (resolution.y - SIZE) / resolution.y;
		uv.y += SIZE / 2. / resolution.y;
	}

	return uv;
}
