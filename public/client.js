"use strict";
var socket = io({ upgrade: false, transports: ["websocket"] });
var screen = document.getElementById("screen");
var rotX = Math.PI*.5;
var rotZ = 0;
var mapSize = 16;
var map = new Int8Array(mapSize*mapSize*mapSize);
var keys = [];
var pos = [.5,.5,.5];
function get(p) {
	if(Math.min(p[0],p[1],p[2])<0 || Math.max(p[0],p[1],p[2])>=mapSize) {
		return -1;
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
	rotZ-=e.movementX*0.01;
	rotX=clamp(rotX-e.movementY*0.01,0,Math.PI)
}
screen.tabIndex = 0;
screen.onkeydown = function(e) {
	keys[e.keyCode] = true;
}

screen.onkeyup = function(e) {
	delete keys[e.keyCode];
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
	color = vec4((sin(position*20.0)),1.0);
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
		add([.5,.5,.5],add(position,mulf(add(normal,f),.5))).forEach(function(s){
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
						if(get(add([x,y,z],n))!==1) {
							quad(vertices, [x,y,z], n);
					
						}
					});
				}
			}
		}
	}
	bufferLength=vertices.length/3;
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
}
draw();
function tick() {
	var s = 0.1;
	var dir = [keys[83]?s:0+keys[87]?-s:0,keys[68]?s:0+keys[65]?-s:0,keys[32]?s:0+keys[67]?-s:0];
	var v = [sin(rotZ) * dir[0] + cos(rotZ) * dir[1], -cos(rotZ) * dir[0] + sin(rotZ) * dir[1], dir[2]];
	for(var i=0;i<3;i++) {
		pos[i]+=v[i];
		if(get(floorv(pos))===-1){
			pos[i]-=v[i];
		}
	}
	var pi = floorv(pos);
	if(get(pi) === 0) {
		socket.emit("dig", pi);
	}
}
function update() {
	tick();
	var w = screen.width = innerWidth
	var h = screen.height = innerHeight
	gl.viewport(0, 0, w, h);
    gl.cullFace(gl.BACK);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.useProgram(program);
	var ptransformUniform = gl.getUniformLocation(program, "transform");
	gl.uniformMatrix4fv(ptransformUniform, false, translate(rotateZ(rotateX(perspective(identity(), 1,w/h,100,0.01),rotX),rotZ),mulf(pos,-1)));
	var vertexPositionAttribute = gl.getAttribLocation(program, "position");
	gl.enableVertexAttribArray(vertexPositionAttribute);
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.TRIANGLES, 0, bufferLength);
	requestAnimationFrame(update);
}

socket.on("dig", function (pos) {
	set(pos,1);
	draw();
});

socket.on("connect", function () {
	console.log("connect");
});

socket.on("disconnect", function () {
	console.log("disconnect");
});

socket.on("error", function () {
	console.log("error");
});

update();
