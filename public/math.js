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
	return multiply(m, [
		1,0,0,0,
		0,cos(a),-sin(a),0,
		0,sin(a),cos(a),0,
		0,0,0,1])
}
function rotateY(m, a){
	return multiply(m, [
		cos(a),0,sin(a),0,
		0,1,0,0,
		-sin(a),0,cos(a),0,
		0,0,0,1])
}
function rotateZ(m, a){
	return multiply(m, [
		cos(a),-sin(a),0,0,
		sin(a),cos(a),0,0,
		0,0,1,0,
		0,0,0,1])
}
function perspective(r,t,f,n) {
	return new Float32Array([
		1/r,  0,      0,          0,
		  0,1/t,      0,          0,
		  0,  0,2/(n-f),(f+n)/(n-f),
		  0,  0,      0,          1])
}
