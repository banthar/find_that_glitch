"use strict";

module.exports = function (socket) {

	socket.on("disconnect", function () {
		console.log("Disconnected: " + socket.id);
	});

	socket.on("x", function (y) {
		console.log("x: ", socket.id, y);
	});

	console.log("Connected: " + socket.id);
};
