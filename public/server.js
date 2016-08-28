"use strict";

var players = {};

module.exports = function (socket) {

	socket.on("disconnect", function () {
		console.log("Disconnected: " + socket.id);
	});
	socket.on("dig", function (pos) {
		console.log("dig", pos);
		for(var id in players) {
			players[id].socket.emit("dig", pos);
		}
	});

	players[socket.id] = {
		socket: socket,
	}
};
