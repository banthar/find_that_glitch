"use strict";
var socket = io({ upgrade: false, transports: ["websocket"] });
var screen = document.getElementById("screen");
var rotX = 0;
var rotZ = 0;
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
gl.attachShader(program, createShader(gl.VERTEX_SHADER, "uniform mat4 transform;attribute vec3 position;void main(void) {gl_Position = transform*vec4(position, 1.0);}"));
gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, "void main(void) {gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);}"));
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
	throw new Error("Unable to initialize the shader program: " + gl.getProgramInfoLog(program));
}
var horizAspect = 480.0/640.0;
var buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
var vertices = new Float32Array(3*100);
for(var i=0;i<vertices.length;i++) {
	vertices[i]=Math.random()*2-1;
}
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

function update() {
	var w = screen.width = innerWidth
	var h = screen.height = innerHeight
	gl.viewport(0, 0, w, h);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.useProgram(program);
	var ptransformUniform = gl.getUniformLocation(program, "transform");
	gl.uniformMatrix4fv(ptransformUniform, false, rotateX(rotateZ(perspective(1,1,10,0.1),rotZ),rotX));
	var vertexPositionAttribute = gl.getAttribLocation(program, "position");
	gl.enableVertexAttribArray(vertexPositionAttribute);
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.TRIANGLES, 0, 100);
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

