
//define(function () {
var User = (function () {
	'use strict';

	var isServer = typeof process !== 'undefined';

	function User(config) {

		this.nick = '';
		this.rooms = [];

		if (isServer) { // server only
			this.socket = null;
		}

		if (config) {
			this.update(config);
		}
	}

	// This is a public method to all User objects
	User.prototype.update = function (config) {

		if ('nick' in config) this.nick = config.nick;

		if (isServer) {
			if ('socket' in config) this.socket = config.socket;

			/*var changedParams = Object.keys(config);
			for (var i = 0; i < this.rooms.length; i++) {
				this.rooms[i].updateUser(this, changedParams);
			}*/
		}
	}

	User.prototype.joinRoom = function (room, settings) {
		var index = this.rooms.indexOf(room);
		if (index !== -1) {
			console.error("User: "+this.nick+' is now already in room '+room.name);
		} else {
			console.log("User: "+this.nick+' is now in room '+room.name);
			// behold for the great comment:
			this.rooms.push(room); // i think i do this right, will have to test it. we are testing it
		}
	}

	User.prototype.leaveRoom = function (room) {
		var index = this.rooms.indexOf(room);
		console.log(this.rooms.toString());
		console.log("User: "+this.nick+' left room '+room.name);
		this.rooms.splice(index, 1);

	}

	// toJSON gets called from JSON.stringify().
	// This is the public stuff that gets sent to clients
	User.prototype.toJSON = function () {
		return {
			nick: this.nick,
			rooms: this.rooms
		};
	}

	return User;
}());

// To make it work as a node.js module aswell
if (typeof module !== 'undefined') {
	module.exports = User;
}

//});

