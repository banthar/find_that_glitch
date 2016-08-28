"use strict";
var socket = io({ upgrade: false, transports: ["websocket"] });
var screen = document.getElementById("screen");
var rotX = 0;
var rotZ = 0;
var mapSize = 16;
var map = new Int8Array(mapSize*mapSize*mapSize);
function get(p) {
	if(Math.min(p[0],p[1],p[2])<0 || Math.max(p[0],p[1],p[2])>=mapSize) {
		return 0;
	}
	return map[(p[2]*mapSize+p[1])*mapSize+p[0]];
}
function set(p,v) {
	if(Math.min(p[0],p[1],p[2])<0 || Math.max(p[0],p[1],p[2])>=mapSize) {
		throw new Error("Out of bounds: "+p);
	}
	map[(p[2]*mapSize+p[1])*mapSize+p[0]] = v;
}
set([0,0,0],1);
set([0,1,0],1);
set([0,2,0],1);
set([1,2,0],1);
set([1,2,1],1);
set([1,2,2],1);
function clamp(v, min, max) {
    return Math.max(min,Math.min(v,max));
}
screen.onclick = function() {
  screen.requestPointerLock();
}

screen.onmousemove = function(e) {
	rotZ+=e.movementX*0.01;
	rotX=clamp(rotX+e.movementY*0.01,0,Math.PI)
}
var gl = screen.getContext("webgl");
function createShader(type, source) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {	
		throw new Error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));	
		gl.deleteShader(shader);
		return null;	
	}
	return shader;
}
var program = gl.createProgram();
gl.attachShader(program, createShader(gl.VERTEX_SHADER, `
precision mediump float;
uniform mat4 transform;
attribute vec3 position;
varying vec4 color;
void main(void) {
	color = vec4(position,1.0);
	gl_Position = transform*vec4(position, 1.0);
}`));
gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, `
precision mediump float;
varying vec4 color;
void main(void) {
	gl_FragColor = color;
}`));
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
	throw new Error("Unable to initialize the shader program: " + gl.getProgramInfoLog(program));
}
var buffer = gl.createBuffer();
var bufferLength = 0;
function quad(v, position, normal) {
	var sign=normal[0]+normal[1]+normal[2];
	var v0 = [normal[1],normal[2],normal[0]];
	var v1 = [normal[2],normal[0],normal[1]];
	var triangles; 
	if(sign>0) {
		triangles = [[-1,-1],[1,1],[-1,1],[-1,-1],[1,-1],[1,1]]
	} else {
		triangles = [[-1,-1],[-1,1],[1,1],[-1,-1],[1,1],[1,-1]];
	}
	triangles.forEach(function(p){
		var f = add(mulf(v0,p[0]),mulf(v1,p[1]));
		add(position,mulf(add(normal,f),.5)).forEach(function(s){
			v.push(s);
		});
	});
}
function draw() {
	var vertices = [];
	for(var z=0;z<mapSize;z++) {
		for(var y=0;y<mapSize;y++) {
			for(var x=0;x<mapSize;x++) {
				if(get([x,y,z])) {
					var i = 0;
					[[-1,0,0],[0,-1,0],[0,0,-1],[0,0,1],[0,1,0],[1,0,0]].forEach(function(n){
						if(!get(add([x,y,z],n))) {
							quad(vertices, [x,y,z], n);
					
						}
					});
				}
			}
		}
	}
	bufferLength=vertices.length/3;
	console.log(vertices);
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
}
draw();
function update() {
	var w = screen.width = innerWidth
	var h = screen.height = innerHeight
	gl.viewport(0, 0, w, h);
    gl.cullFace(gl.BACK);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.useProgram(program);
	var ptransformUniform = gl.getUniformLocation(program, "transform");
	gl.uniformMatrix4fv(ptransformUniform, false, rotateZ(rotateX(perspective(1,1,10,0.1),rotX),rotZ));
	var vertexPositionAttribute = gl.getAttribLocation(program, "position");
	gl.enableVertexAttribArray(vertexPositionAttribute);
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.TRIANGLES, 0, bufferLength);
	requestAnimationFrame(update);
}
update();

socket.on("x", function (y) {
		console.log("x", y);
});

socket.on("connect", function () {
	socket.emit("x", [1,2,3]);
		console.log("connect");
});

socket.on("disconnect", function () {
		console.log("disconnect");
});

socket.on("error", function () {
		console.log("error");
});

