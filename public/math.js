"use strict";
var cos = Math.cos;
var sin = Math.sin;
function identity() {
	return new Float32Array([
		1,0,0,0,
		0,1,0,0,
		0,0,1,0,
		0,0,0,1]);
}
function multiply(a,b) {
	var c = new Float32Array(16);
	for(var y=0;y<4;y++) {
		for(var x=0;x<4;x++) {
			for(var k=0;k<4;k++) {
				c[y*4+x]+=a[y*4+k]*b[k*4+x];
			}
		}
	}
	return c;
}
function rotateX(m, a){
	return multiply([
		1,0,0,0,
		0,cos(a),-sin(a),0,
		0,sin(a),cos(a),0,
		0,0,0,1],m)
}
function rotateY(m, a){
	return multiply([
		cos(a),0,sin(a),0,
		0,1,0,0,
		-sin(a),0,cos(a),0,
		0,0,0,1],m)
}
function rotateZ(m, a){
	return multiply([
		cos(a),-sin(a),0,0,
		sin(a),cos(a),0,0,
		0,0,1,0,
		0,0,0,1],m)
}
function perspective(r,t,f,n) {
	return new Float32Array([
		1/r,  0,      0,          0,
		  0,1/t,      0,          0,
		  0,  0,2/(n-f),(f+n)/(n-f),
		  0,  0,      0,          1])
}
function add(a,b) {
	var c = new Float32Array(a.length);
	for(var i=0;i<c.length;i++) {
		c[i]=a[i]+b[i];
	}
	return c;
}
function mulf(a,b) {
	var c = new Float32Array(a.length);
	for(var i=0;i<c.length;i++) {
		c[i]=a[i]*b;
	}
	return c;
}

