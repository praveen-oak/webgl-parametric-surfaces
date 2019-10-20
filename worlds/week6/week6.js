"use strict"


const VERTEX_SIZE = 6; // EACH VERTEX CONSISTS OF: x,y,z, ny,ny,nz
let to_print = true;

 //////////////////////////////////////////////////////////////////
//                                                                //
//  FOR HOMEWORK, YOU CAN ALSO TRY DEFINING DIFFERENT SHAPES,     //
//  BY CREATING OTHER VERTEX ARRAYS IN ADDITION TO cubeVertices.  //
//                                                                //
 //////////////////////////////////////////////////////////////////

let createCubeVertices = () => {
   let v = [];
   let addVertex = a => {
      for (let i = 0 ; i < a.length ; i++)
         v.push(a[i]);
   }

   // EACH SQUARE CONSISTS OF TWO TRIANGLES.

   let addSquare = (a,b,c,d) => {
      addVertex(c);
      addVertex(b);
      addVertex(a);

      addVertex(b);
      addVertex(c);
      addVertex(d);
   }

   // VERTEX DATA FOR TWO OPPOSING SQUARE FACES. EACH VERTEX CONSISTS OF: x,y,z, nx,ny,nz

   let P = [[-1,-1,-1, 0,0,-1],[ 1,-1,-1, 0,0,-1],[-1, 1,-1, 0,0,-1],[ 1, 1,-1, 0,0,-1],
            [-1,-1, 1, 0,0, 1],[ 1,-1, 1, 0,0, 1],[-1, 1, 1, 0,0, 1],[ 1, 1, 1, 0,0, 1]];

   // LOOP THROUGH x,y,z. EACH TIME ADD TWO OPPOSING FACES, THEN PERMUTE COORDINATES.

   for (let n = 0 ; n < 3 ; n++) {
      addSquare(P[0],P[1],P[2],P[3]);
      addSquare(P[4],P[5],P[6],P[7]);
      for (let i = 0 ; i < P.length ; i++)
         P[i] = [P[i][1],P[i][2],P[i][0], P[i][4],P[i][5],P[i][3]];
   }

   return v;
}

let createSphereVertices = () => {
   let v = [];
   let addVertex = a => {
      for (let i = 0 ; i < a.length ; i++)
         v.push(a[i]);
   }

   // EACH SQUARE CONSISTS OF TWO TRIANGLES.

   let addSquare = (a,b,c,d) => {
      addVertex(c);
      addVertex(b);
      addVertex(a);

      addVertex(b);
      addVertex(c);
      addVertex(d);
   }

   // VERTEX DATA FOR TWO OPPOSING SQUARE FACES. EACH VERTEX CONSISTS OF: x,y,z, nx,ny,nz

   let P = [[-1,-1,-1, 0,0,-1],[ 1,-1,-1, 0,0,-1],[-1, 1,-1, 0,0,-1],[ 1, 1,-1, 0,0,-1],
            [-1,-1, 1, 0,0, 1],[ 1,-1, 1, 0,0, 1],[-1, 1, 1, 0,0, 1],[ 1, 1, 1, 0,0, 1]];

   // LOOP THROUGH x,y,z. EACH TIME ADD TWO OPPOSING FACES, THEN PERMUTE COORDINATES.

   for (let n = 0 ; n < 3 ; n++) {
      addSquare(P[0],P[1],P[2],P[3]);
      addSquare(P[4],P[5],P[6],P[7]);
      for (let i = 0 ; i < P.length ; i++)
         P[i] = [P[i][1],P[i][2],P[i][0], P[i][4],P[i][5],P[i][3]];
   }

   return v;
}

let cubeVertices = createCubeVertices();

let sphereVertices = createSphereVertices();



async function setup(state) {
    hotReloadFile(getPath('week5.js'));

    state.m = new Matrix();

    let libSources = await MREditor.loadAndRegisterShaderLibrariesForLiveEditing(gl, "libs", [
        { 
            key : "pnoise", path : "shaders/noise.glsl", foldDefault : true
        },
        {
            key : "sharedlib1", path : "shaders/sharedlib1.glsl", foldDefault : true
        },      
    ]);

    if (!libSources) {
        throw new Error("Could not load shader library");
    }

    // load vertex and fragment shaders from the server, register with the editor
    let shaderSource = await MREditor.loadAndRegisterShaderForLiveEditing(
        gl,
        "mainShader",
        { 
            onNeedsCompilation : (args, libMap, userData) => {
                const stages = [args.vertex, args.fragment];
                const output = [args.vertex, args.fragment];

                const implicitNoiseInclude = true;
                if (implicitNoiseInclude) {
                    let libCode = MREditor.libMap.get("pnoise");

                    for (let i = 0; i < 2; i += 1) {
                        const stageCode = stages[i];
                        const hdrEndIdx = stageCode.indexOf(';');
                        
                        /*
                        const hdr = stageCode.substring(0, hdrEndIdx + 1);
                        output[i] = hdr + "\n#line 1 1\n" + 
                                    libCode + "\n#line " + (hdr.split('\n').length) + " 0\n" + 
                                    stageCode.substring(hdrEndIdx + 1);
                        console.log(output[i]);
                        */
                        const hdr = stageCode.substring(0, hdrEndIdx + 1);
                        
                        output[i] = hdr + "\n#line 2 1\n" + 
                                    "#include<pnoise>\n#line " + (hdr.split('\n').length + 1) + " 0" + 
                            stageCode.substring(hdrEndIdx + 1);

                        //console.log(output[i]);
                    }
                }

                MREditor.preprocessAndCreateShaderProgramFromStringsAndHandleErrors(
                    output[0],
                    output[1],
                    libMap
                );
            },
            onAfterCompilation : (program) => {
                state.program = program;

                gl.useProgram(program);

                state.uColorLoc               = gl.getUniformLocation(program, 'uColor');
                state.uCursorLoc              = gl.getUniformLocation(program, 'uCursor');
                state.uModelLoc               = gl.getUniformLocation(program, 'uModel');
                state.uProjLoc                = gl.getUniformLocation(program, 'uProj');
                state.uTimeLoc                = gl.getUniformLocation(program, 'uTime');
                state.uViewLoc                = gl.getUniformLocation(program, 'uView');
                state.material_index          = gl.getUniformLocation(program, 'material_index');

                state.uMaterialsLoc = [];

                state.uMaterialsLoc[0] = {};
                state.uMaterialsLoc[0].diffuse              = gl.getUniformLocation(program, 'uMaterials[0].diffuse');
                state.uMaterialsLoc[0].ambient              = gl.getUniformLocation(program, 'uMaterials[0].ambient');
                state.uMaterialsLoc[0].specular             = gl.getUniformLocation(program, 'uMaterials[0].specular');
                state.uMaterialsLoc[0].power                = gl.getUniformLocation(program, 'uMaterials[0].power');
                state.uMaterialsLoc[0].reflection_factor    = gl.getUniformLocation(program, 'uMaterials[0].reflection_factor');
                state.uMaterialsLoc[0].refraction_factor    = gl.getUniformLocation(program, 'uMaterials[0].refraction_factor');
                state.uMaterialsLoc[0].index_of_refrac      = gl.getUniformLocation(program, 'uMaterials[0].index_of_refrac');
                

                state.uMaterialsLoc[1] = {};
                state.uMaterialsLoc[1].diffuse              = gl.getUniformLocation(program, 'uMaterials[1].diffuse');
                state.uMaterialsLoc[1].ambient              = gl.getUniformLocation(program, 'uMaterials[1].ambient');
                state.uMaterialsLoc[1].specular             = gl.getUniformLocation(program, 'uMaterials[1].specular');
                state.uMaterialsLoc[1].power                = gl.getUniformLocation(program, 'uMaterials[1].power');
                state.uMaterialsLoc[1].reflection_factor    = gl.getUniformLocation(program, 'uMaterials[1].reflection_factor');
                state.uMaterialsLoc[1].refraction_factor    = gl.getUniformLocation(program, 'uMaterials[1].refraction_factor');
                state.uMaterialsLoc[1].index_of_refrac      = gl.getUniformLocation(program, 'uMaterials[1].index_of_refrac');

                state.uMaterialsLoc[2] = {};
                state.uMaterialsLoc[2].diffuse              = gl.getUniformLocation(program, 'uMaterials[2].diffuse');
                state.uMaterialsLoc[2].ambient              = gl.getUniformLocation(program, 'uMaterials[2].ambient');
                state.uMaterialsLoc[2].specular             = gl.getUniformLocation(program, 'uMaterials[2].specular');
                state.uMaterialsLoc[2].power                = gl.getUniformLocation(program, 'uMaterials[2].power');
                state.uMaterialsLoc[2].reflection_factor    = gl.getUniformLocation(program, 'uMaterials[2].reflection_factor');
                state.uMaterialsLoc[2].refraction_factor    = gl.getUniformLocation(program, 'uMaterials[2].refraction_factor');
                state.uMaterialsLoc[2].index_of_refrac      = gl.getUniformLocation(program, 'uMaterials[2].index_of_refrac');
            } 
        },
        {
            paths : {
                vertex   : "shaders/vertex.vert.glsl",
                fragment : "shaders/fragment.frag.glsl"
            },
            foldDefault : {
                vertex   : true,
                fragment : false
            }
        }
    );

    state.cursor = ScreenCursor.trackCursor(MR.getCanvas());

    if (!shaderSource) {
        throw new Error("Could not load shader");
    }

    // Create a square as a triangle strip consisting of two triangles
    state.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, state.buffer);

 ///////////////////////////////////////////////////////////
//                                                         //
//  HINT: IF YOU WANT TO IMPLEMENT MORE THAN ONE SHAPE,    //
//  YOU MIGHT WANT TO CALL gl.bufferData()                 //
//  MULTIPLE TIMES IN onDraw() INSTEAD OF HERE,            //
//  USING OTHER ARRAY VALUES IN ADDITION TO cubeVertices.  //
//                                                         //
 ///////////////////////////////////////////////////////////

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array( cubeVertices ), gl.STATIC_DRAW);

    let bpe = Float32Array.BYTES_PER_ELEMENT;

    let aPos = gl.getAttribLocation(state.program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, bpe * VERTEX_SIZE, bpe * 0);

    let aNor = gl.getAttribLocation(state.program, 'aNor');
    gl.enableVertexAttribArray(aNor);
    gl.vertexAttribPointer(aNor, 3, gl.FLOAT, false, bpe * VERTEX_SIZE, bpe * 3);
}


 /////////////////////////////////////////////////////////////////////
//                                                                   //
//  FOR HOMEWORK, YOU NEED TO IMPLEMENT THESE SIX MATRIX FUNCTIONS.  //
//  EACH FUNCTION SHOULD RETURN AN ARRAY WITH 16 VALUES.             //
//                                                                   //
//  SINCE YOU ALREADY DID THIS FOR THE PREVIOUS ASSIGNMENT,          //
//  YOU CAN JUST USE THE FUNCTION DEFINITIONS YOU ALREADY CREATED.   //
//                                                                   //
 /////////////////////////////////////////////////////////////////////

let identity = ()       => {
    let transformation_matrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
    return transformation_matrix;


};
let rotateX = t         => {

    const radians = t * (Math.PI/180);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    let transformation_matrix = [1,0,0,0,  0,cos,sin,0,  0,-1*sin,cos,0   ,0,0,0,1];
    return transformation_matrix;
};
let rotateY = t         => {
    const radians = t * (Math.PI/180);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    let transformation_matrix = [cos,0,-1*sin,0,  0,1,0,0,  sin,0,cos,0,  0,0,0,1];
    return transformation_matrix;
};
let rotateZ = t         => {
    const radians = t * (Math.PI/180);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    let transformation_matrix = [cos,sin,0,0,  -1*sin,cos,0,0,  0,0,1,0   ,0,0,0,1];
    return transformation_matrix;

};
let scale = (x,y,z)     => {
    let transformation_matrix = [x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1];
    return transformation_matrix;
};
let translate = (x,y,z) => {
    let transformation_matrix = [1,0,0,0,  0,1,0,0,  0,0,1,0,  x,y,z,1];
    return transformation_matrix;
};



let inverse = src => {
  let dst = [], det = 0, cofactor = (c, r) => {
     let s = (i, j) => src[c+i & 3 | (r+j & 3) << 2];
     return (c+r & 1 ? -1 : 1) * ( (s(1,1) * (s(2,2) * s(3,3) - s(3,2) * s(2,3)))
                                 - (s(2,1) * (s(1,2) * s(3,3) - s(3,2) * s(1,3)))
                                 + (s(3,1) * (s(1,2) * s(2,3) - s(2,2) * s(1,3))) );
  }
  for (let n = 0 ; n < 16 ; n++) dst.push(cofactor(n >> 2, n & 3));
  for (let n = 0 ; n <  4 ; n++) det += src[n] * dst[n << 2];
  for (let n = 0 ; n < 16 ; n++) dst[n] /= det;
  return dst;
}

let multiply = (a, b) => {
   let c = [];
   for (let n = 0 ; n < 16 ; n++)
      c.push( a[n&3     ] * b[    n&12] +
              a[n&3 |  4] * b[1 | n&12] +
              a[n&3 |  8] * b[2 | n&12] +
              a[n&3 | 12] * b[3 | n&12] );
   return c;
}

let Matrix = function() {
   let topIndex = 0,
       stack = [ identity() ],
       getVal = () => stack[topIndex],
       setVal = m => stack[topIndex] = m;

   this.identity  = ()      => setVal(identity());
   this.restore   = ()      => --topIndex;
   this.rotateX   = t       => setVal(multiply(getVal(), rotateX(t)));
   this.rotateY   = t       => setVal(multiply(getVal(), rotateY(t)));
   this.rotateZ   = t       => setVal(multiply(getVal(), rotateZ(t)));
   this.save      = ()      => stack[++topIndex] = stack[topIndex-1].slice();
   this.scale     = (x,y,z) => setVal(multiply(getVal(), scale(x,y,z)));
   this.translate = (x,y,z) => setVal(multiply(getVal(), translate(x,y,z)));
   this.value     = ()      => getVal();
}

function onStartFrame(t, state) {

    state.color0 = [1,.5,.2];


    // uTime IS TIME IN SECONDS SINCE START TIME.

    if (!state.tStart)
        state.tStart = t;
    state.time = (t - state.tStart) / 1000;

    gl.uniform1f (state.uTimeLoc  , state.time);


    // uCursor WILL GO FROM -1 TO +1 IN xy, WITH z = 0 FOR MOUSE UP, 1 FOR MOUSE DOWN.

    let cursorValue = () => {
       let p = state.cursor.position(), canvas = MR.getCanvas();
       return [ p[0] / canvas.clientWidth * 2 - 1, 1 - p[1] / canvas.clientHeight * 2, p[2] ];
    }

    gl.uniform3fv(state.uCursorLoc, cursorValue());

    gl.uniform1i(state.material_index, 1);

    //skin
    gl.uniform3fv(state.uMaterialsLoc[0].ambient , [.3,.25,.05]);
    gl.uniform3fv(state.uMaterialsLoc[0].diffuse , [.7,.7,.7]);
    gl.uniform3fv(state.uMaterialsLoc[0].specular, [0.9,.9,.9]);
    gl.uniform1f(state.uMaterialsLoc[0].power   , 12);
    gl.uniform1f(state.uMaterialsLoc[0].reflection_factor   , .2);
    gl.uniform1f(state.uMaterialsLoc[0].refraction_factor   , .2);
    gl.uniform1f(state.uMaterialsLoc[0].index_of_refrac   , 1.1);

    //shirt
    gl.uniform3fv(state.uMaterialsLoc[1].ambient , [.0,.1,.1]);
    gl.uniform3fv(state.uMaterialsLoc[1].diffuse , [0.,.4,.0]);
    gl.uniform3fv(state.uMaterialsLoc[1].specular, [0.5,.5,.5]);
    gl.uniform1f(state.uMaterialsLoc[1].power   , 20);
    gl.uniform1f(state.uMaterialsLoc[1].reflection_factor   , .2);
    gl.uniform1f(state.uMaterialsLoc[1].refraction_factor   , .2);
    gl.uniform1f(state.uMaterialsLoc[1].index_of_refrac   , 1.8);

    //shorts
    gl.uniform3fv(state.uMaterialsLoc[2].ambient , [.128,.0,.0]);
    gl.uniform3fv(state.uMaterialsLoc[2].diffuse , [0.2,.0,.0]);
    gl.uniform3fv(state.uMaterialsLoc[2].specular, [0.5,.5,.2]);
    gl.uniform1f(state.uMaterialsLoc[2].power   , 20);
    gl.uniform1f(state.uMaterialsLoc[2].reflection_factor   , .7);
    gl.uniform1f(state.uMaterialsLoc[2].refraction_factor   , .7);
    gl.uniform1f(state.uMaterialsLoc[2].index_of_refrac   , 1.8);



    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
}

Array.prototype.extend = function (other_array) {
    /* You should include a test to check whether other_array really is an array */
    other_array.forEach(function(v) {this.push(v)}, this);
}

function createMesh(M, N, callback){
  const col_values = M-1;
  const row_values = N-1;

  const col_addition = 1/col_values;
  const row_addition = 1/row_values;

  const total_triangles = 1+((2*M-1)*(N-1));

  let index = 0
  let u = 1;
  let v = 0;
  let is_v_high = false;
  let is_u_decreasing = true;
  let return_array = [];
  // let m_index = 0
  while(index < total_triangles){
    return_array.extend(callback(u, v));
    index = index + 1;
    if(is_u_decreasing === true && round(u) === 0 && is_v_high === true){
        is_u_decreasing = false;
        v = v + row_addition;
        u = 0;
    }else if(is_u_decreasing === false && round(u) === 1 && is_v_high == true){
      is_u_decreasing = true;
      v = v + row_addition;
      u = 1;
    }else{
      if(is_u_decreasing === true){
        if(is_v_high === true){
          v = v - row_addition;
          u = u - col_addition;
          is_v_high = false;
        }else{
          v = v + row_addition;
          is_v_high = true;
        }
      }else{
        if(is_v_high === true){
          v = v - row_addition;
          u = u + col_addition;
          is_v_high = false;
        }else{
          v = v + row_addition;
          is_v_high = true;
        }
      }
    }
  }
  return return_array;

}

function round(value){
  return Math.round(value * 10000) / 10000;
}

function uvToSphere(u,v){

    let theta = 2*Math.PI*u;
    let fi = Math.PI*v - Math.PI/2

    let x = round(Math.cos(theta)*Math.cos(fi));
    let y = round(Math.sin(theta)*Math.cos(fi));
    let z = round(Math.sin(fi));
    return [x,y,z, x,y,z]
}

function uvToTorus(u,v){
    let r = 0.5;
    let theta = 2*Math.PI*u;
    let fi = 2*Math.PI*v;

    let x = round(Math.cos(theta)*(1+ r*Math.cos(fi)));
    let y = round(Math.sin(theta)*(1+ r*Math.cos(fi)));
    let z = r*round(Math.sin(fi));
    let nx = round(Math.cos(theta)*Math.cos(fi));
    let ny = round(Math.sin(theta)*Math.cos(fi));
    let nz = round(Math.sin(fi));
    return [x,y,z, nx,ny,nz];
}

function uvToOpenTube(u, v){
  let theta = 2*Math.PI*u;
  let x = round(Math.cos(theta));
  let y = round(Math.sin(theta));
  let z = 2*v - 1;
  return [x,y,z,x,y,0];

}

function uvToCappedCylinder(u, v){
  let theta = 2*Math.PI*u;
  let c = round(Math.cos(theta));
  let s = round(Math.sin(theta));
  let z = Math.max(-1, Math.min(1, 10*v - 5));
  switch (Math.floor(5.001 * v)) {
    case 0: case 5: return [ 0,0,z, 0,0,z ] // center of back/front end cap
    case 1: case 4: return [ c,s,z, 0,0,z ] // perimeter of back/front end cap
    case 2: case 3: return [ c,s,z, c,s,0 ] // back/front of cylindrical tube
  }

}



function onDraw(t, projMat, viewMat, state, eyeIdx) {

    let m = state.m;

    gl.uniformMatrix4fv(state.uViewLoc, false, new Float32Array(viewMat));
    gl.uniformMatrix4fv(state.uProjLoc, false, new Float32Array(projMat));

    let drawShape = (color, type, vertices) => {
       gl.uniform3fv(state.uColorLoc, color);
       gl.uniformMatrix4fv(state.uModelLoc, false, m.value());
       gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
       gl.drawArrays(type, 0, vertices.length / VERTEX_SIZE);
    }

    let theta = (45*Math.cos(state.time)-270)*Math.PI/180;
    // let theta = state.time;
    let ball_radius = 0.6;
    let spike_radius = 0.08;
    m.identity();
    // m.translate(Math.sin(theta), 0, 0);
    m.translate(0,0,-6);
    m.translate(0, 2, 0);

    let i = 0;
    m.save();
      m.scale(2, 0.5, 0.5);
      drawShape([1,1,0], gl.TRIANGLES, cubeVertices);
    m.restore();
    m.save()
       
        m.scale(0.02, 0.05, 0.02);
        for(let y = 0; y <= 40; y = y + 2){
          m.save();
          m.translate(y*Math.cos(theta), -y*Math.sin(theta), 0);
          drawShape([1,1,0], gl.TRIANGLE_STRIP, createMesh(50, 50, uvToTorus));
          m.restore();
        }

    m.restore();
    m.translate(0, -1, 0);
    m.translate(1*Math.cos(theta), -1.4*Math.sin(theta), 0);
    m.scale(ball_radius, ball_radius, ball_radius);
    
    drawShape([1,1,0], gl.TRIANGLE_STRIP, createMesh(50, 50, uvToSphere));
    
    
    gl.uniform1i(state.material_index, 1);
    
    for(let fi = -90; fi <= 90; fi = fi+45){
      for(let i = 0; i < 360; i = i + 30){
        m.save();
          let dist = 2*ball_radius-3*spike_radius;
          let x = dist*Math.cos(i*Math.PI/180)*Math.cos(fi*Math.PI/180);
          let y = dist*Math.sin(i*Math.PI/180)*Math.cos(fi*Math.PI/180);
          let z = dist*round(Math.sin(fi*Math.PI/180));
          m.translate(x, y, z);
          m.scale(spike_radius, spike_radius, spike_radius);
          m.rotateY(45);
          m.rotateZ(45);
          gl.uniform1i(state.material_index, 1);
          drawShape([1,1,0], gl.TRIANGLES, cubeVertices);
        m.restore();
      }
    }


    
    
    // gl.uniform1i(state.material_index, 1);
    
    // m.rotateZ(45);
    
}


function onEndFrame(t, state) {
}

export default function main() {
    const def = {
        name         : 'week5',
        setup        : setup,
        onStartFrame : onStartFrame,
        onEndFrame   : onEndFrame,
        onDraw       : onDraw,
    };

    return def;
}
