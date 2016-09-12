"use strict";

var players = new Set();

var digTimeout = 5000;
var digPause = 3000;

var hideTimeout = 5000;
var hidePause = 3000;

var findTimeout = 5000;
var findPause = 3000;

function main() {
	players.forEach(function(player){
		player.socket.emit("digStart", digTimeout);
	});
	setTimeout(function(){
		players.forEach(function(player){
			player.socket.emit("digEnd", digPause);
		});
		setTimeout(function(){
			var dugOut = [];
			players.forEach(function(player){
				if(player.dugOut) {
					player.dugOut.forEach(function(p){
						dugOut.push(p);
					});
					player.dugOut = null;
				}
			});
			players.forEach(function(player){
				player.socket.emit("hideStart", hideTimeout, dugOut);
			});
			setTimeout(function(){
				players.forEach(function(player){
						player.socket.emit("hideEnd", hidePause);
				});
				setTimeout(function(){
					var positions = [];
					players.forEach(function(player){
						if(player.pos) {
							positions.push(player.pos);
							player.pos = null;
						}
					});
					players.forEach(function(player){
							player.socket.emit("findStart", findTimeout, positions);
					});
					setTimeout(function(){
						players.forEach(function(player){
								player.socket.emit("findEnd", findPause);
						});
						setTimeout(function(){
							main();
						},findPause);
					},findTimeout);
				},hidePause);
			},hideTimeout);
		},digPause);
	},digTimeout);
}

module.exports = function (socket) {
	var player = {
		socket: socket,
	}
	players.add(player);
	socket.on("disconnect", function () {
		console.log("Disconnected: " + socket.id);
	});
	socket.on("dugOut", function(dugOut) {
		player.dugOut = dugOut;
	});
	socket.on("hideAt", function(pos) {
		player.pos = pos;
	});
	if(players.size==1) {
		main();
	}
};
