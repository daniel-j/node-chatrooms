
//define(function () {
var Room = (function () {
	'use strict';

	var isServer = typeof process !== 'undefined';

	function Room(name) {
		this.name = name;

		this.users = {};

		if (isServer) {
			
			this.settings = {};

		} else {
			this.userlist = new UserManager();
		}
	}

	Room.prototype.joinUser = function (user, settings) {
		if (this.users[user.nick]) {
			console.error("Room: "+user.nick+' is already in the room '+this.name);
			return this.users[user.nick];
		}
		console.log("Room: Addning "+user.nick+' to room '+this.name);
		this.users[user.nick] = user;
		if (isServer) {
			this.settings[user.nick] = settings || {};
		} else {
			user = this.userlist.addUser(user);
			this.userlist.update();
		}
		return user;
	}

	Room.prototype.removeUser = function (user) {
		console.log("Room: Removing "+user.nick+' from room '+this.name);
		delete this.users[user.nick];
		if (isServer) {
			delete this.settings[user.nick];
		} else {
			this.userlist.removeUser(user);
		}
		
	}

	Room.prototype.clearUserlist = function () {
		this.userlist.clear();
	}

	Room.prototype.createUserlist = function (list) {
		this.clearUserlist();

		for (var i in list) {
			var user = this.userlist.addUser(list[i]);
			
		}
		this.userlist.update();
	}

	// server only
	Room.prototype.getSettingsOfUser = function (user) {
		var index = this.users.indexOf(user);
		return this.settings[index];
	}

	Room.prototype.isEmpty = function () {
		if (isServer) {
			return this.users.length === 0;
		} else {
			return this.userlist.users.length === 0;
		}
		
	}

	Room.prototype.getUserlist = function () {
		return {users: this.users, settings: this.settings};
	}

	Room.prototype.toString = function () {
		return this.name;
	}
	Room.prototype.toJSON = function () {
		return this.name;
	}

	



	// so this is a bad idea
	/*Room.prototype.updateUser = function (user, changedParams) {
		// if you change nickname, you must notify all rooms that the user are in
		// in my version you can
		// i have not implemented renaming yet
		
		// When a user changes name, it should only be sent to the other clients once, if the user is in multiple rooms.
		// I must do a manual broadcast?
		// But i must emit to all rooms user is in?
		// That message should show in all rooms the user is in.
		// But only once in each room.
		// If i do a room broadcast, the same message may go multiple times to another user is same rooms.
		// The other rooms dont see that you joined room X
		// I must do multiple emits, to all rooms.
		/*
		User1 and User2 are in the same 1000 rooms

		User1 change nickname to djazz.

		User2 will get notfied with emit from all 1000 rooms (1000 identical packets).

		Yes, but its only one packet, but irc client shows it twice. yeah.

		I must write my own broadcast function

		the server must keep track on what users has got the update

		



		var index = this.users.indexOf(user);
	}*/



	return Room;
}());

// To make it work as a node.js module aswell
if (typeof module !== 'undefined') {
	module.exports = Room;
}
//});

