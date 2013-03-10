
var isServer = typeof process !== 'undefined';

if (isServer) {
	Room = require(__dirname + '/Room.js');
}

//define(function () {
var RoomManager = (function () {
	'use strict';


	

	// usage: new RoomManager();
	// it handles the rooms

	function RoomManager(io) {

		this.rooms = {};
		this.users = {};

		if (isServer) {
			this.io = io;
			this.rooms['system'] = new Room('system');
		}

	}

	RoomManager.prototype.joinRoom = function (name, user, settings) {

		if (this.rooms[name] && this.rooms[name].users[user.nick]) {
			console.error("RoomManager.joinRoom: "+user.nick+' is already in the room '+name);
			return;
		}

		console.log("RoomManager.joinRoom:", user.nick, 'is joining room', name);

		// settings are user-specific to this room.
		// well, how would others see the color etc..?

		// global settings are in User object.

		// both sides use this class. yeah i know. on client side you have UserManager
		// you dont on server. it mostly handles the userlist nodes.

		if (!this.rooms.hasOwnProperty(name)) {
			// create room
			this.rooms[name] = new Room(name);
		}
		var room = this.rooms[name];

		if (isServer) {
			room.joinUser(user, settings);
		} else {
			user = room.joinUser(user, settings);
		}
		this.users[user.nick] = user;
		
		user.joinRoom(room);

		if (isServer) {
			user.socket.join(name);

			user.socket.emit('joinroom', {
				userlist: room.getUserlist(),
				room: name
			});
			this.emitToRoom(name, 'join', {
				user: user
			});
			
		} else {
			return user;
		}
	}

	RoomManager.prototype.leaveRoom = function (name, user, skipEmit) {

		if (!this.rooms[name].users[user.nick]) {
			console.log("RoomManager.leaveRoom: " + user.nick + ' is not in room '+name);
			return;
		}

	
		console.log("RoomManager.leaveRoom: " + user.nick + ' is leaving room '+name);

		var room = this.rooms[name];

		room.removeUser(user);
		user.leaveRoom(room);

		
		if (isServer && !skipEmit) {
			this.emitToRoom(name, 'leave', {
				nick: user.nick
			});
		} else {

		}

		if (isServer) {
			user.socket.leave(name);
		}

		// where was i...?

		if (name !== 'system' && room.isEmpty()) {
			delete this.rooms[name];
		}

		if (user.rooms.length === 0) { // just in case
			delete this.users[user.name];
		}
	}

	RoomManager.prototype.createRoomFromList = function (name, userlist) {
		this.rooms[name] = new Room(name);
		for (var i = 0; i < this.rooms[name].userlist.users.length; i++) {
			var list = this.rooms[name].userlist.users[i];
			var rooms = list[i].rooms;
			list[i].rooms = [];
			for (var j = 0; j < rooms.length; j++) {
				list[i].rooms[j] = this.rooms[list[i].rooms[j]];
			}
		}
		

		this.rooms[name].createUserlist(userlist); // this don't set room, i think
		for (var i = 0; i < this.rooms[name].userlist.users.length; i++) {
			var user = this.rooms[name].userlist.users[i];
			this.users[user.nick] = user;
		}
	}

	RoomManager.prototype.leaveAllRooms = function (user) {
		console.log("RoomManager.leaveAllRooms:", user.rooms);
		var self = this;
		console.log(user.rooms);
		user.rooms.forEach(function (room) {
			self.leaveRoom(room.name, user, true);
		});
	}

	RoomManager.prototype.emitToRoom = function (name, type, data, user) {
		data.room = name;
		if (user) {
			throw "TODO";
		} else {
			this.io.sockets.in(name).emit(type, data);
		}
		
	}

	RoomManager.prototype.getRoomByName = function (name) {
		return this.rooms[name];
	}
	RoomManager.prototype.clearUserlists = function () {
		// when you reconnect, for example, clear all
		for (var i in this.rooms) {
			this.rooms[i].clearUserlist();
		}
	}


	return RoomManager;
}());

// To make it work as a node.js module aswell
if (typeof module !== 'undefined') {
	module.exports = RoomManager;
}

//});

