#version 300 es        // NEWER VERSION OF GLSL
precision highp float; // HIGH PRECISION FLOATS

struct Material {
      vec3  ambient;
      vec3  diffuse;
      vec3  specular;
      float power;
      float reflection_factor;
      float refraction_factor;
      float index_of_refrac;
};

const int NS = 3;
Material uMaterials[NS];
uniform float material_index;

uniform vec3  uColor;
uniform vec3  uCursor; // CURSOR: xy=pos, z=mouse up/down
uniform float uTime;   // TIME, IN SECONDS

in vec2 vXY;           // POSITION ON IMAGE
in vec3 vPos;          // POSITION
in vec3 vNor;          // NORMAL

out vec4 fragColor;    // RESULT WILL GO HERE

//normalizes a vector
vec3 normal(vec3 vector){
     float length = length(vector);
     return vec3(float(vector.x/length), float(vector.y/length), float(vector.z/length));
}

vec3 specular_light(vec3 lDir, int shape_index, vec3 surface, vec3 w, vec3 surface_normal){
    vec3 temp = 2.*dot(surface_normal, lDir)*surface_normal - lDir;
    float reflection_factor = max(0., pow(dot(-1.*w, temp), uMaterials[shape_index].power));
    return uMaterials[shape_index].specular*reflection_factor;
}

void main() {
    vec3 lDir  = normalize(vec3(0.,1.,1.));
    	
    float fl = -5.;
    vec3 w = normal(vec3(vXY.x, vXY.y, fl));
    uMaterials[0].specular = vec3(0.9,0.9,0.9);
    uMaterials[0].power = 12.;
    vec3 shade = vec3(.1,.0,.0);
    shade = shade  + specular_light(lDir, 0, vPos, w, normal(vNor));
   
    // HIGHLIGHT CURSOR POSITION WHILE MOUSE IS PRESSED
    // if (uCursor.z > 0. && min(abs(uCursor.x - vXY.x), abs(uCursor.y - vXY.y)) < .01)
    //       color = vec3(1.,1.,1.);

    
    fragColor = vec4(sqrt(shade), 1.0);
    // fragColor = vec4(sqrt(uMaterials[0].specular), 1.0);
}


