"use strict";

var players = new Set();

function main() {
	players.forEach(function(player){
		player.socket.emit("digStart");
	});
	setTimeout(function(){
		players.forEach(function(player){
			player.socket.emit("digEnd");
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
				player.socket.emit("hideStart", dugOut);
			});
			setTimeout(function(){
				players.forEach(function(player){
						player.socket.emit("hideEnd");
				});
				setTimeout(function(){
					var positions = [];
					players.forEach(function(player){
						if(player.pos) {
							positions.push(player.pos);
						}
					});
					players.forEach(function(player){
							player.socket.emit("findStart", positions);
					});
					setTimeout(function(){
						players.forEach(function(player){
								player.socket.emit("findEnd");
						});
						setTimeout(function(){
							main();
						},3000);
					},3000);
				},3000);
			},3000);
		},3000);
	},3000);
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
