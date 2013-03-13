#!/usr/bin/env node
'use strict';

var port = 9003;

var http = require('http');
var express = require('express');

var app = express();
app.use(express.static(__dirname + '/static'));
var server = http.createServer(app);
server.listen(port, function () {
	console.log("Chat server started on port "+port);
});
var io = require('socket.io').listen(server);

// To use of V8's hidden classes, optimized
// Else all objects are unique. All user objects share internally the same class in V8.
function User(config) {
	this.socket = config.socket || null;
	this.nick = config.nick || '';

	this.update = function (config) {
		for (var i in config) {
			if (config.hasOwnProperty(i)) {
				this[i] = config[i];
			}
		}
	}

	this.toJSON = function () {
		return {
			nick: this.nick
		}
	}
}

function UserSettings(config) {
	config = config || {};
	this.ready = !!config.ready;
	this.color = config.color || '';

	this.update = function (settings) {
		for (var i in settings) {
			if (settings.hasOwnProperty(i)) {
				this[i] = settings[i];
			}
		}
	}
}

// here we store more global info about users. it share same indexing as nicks
var users = [];
var nicks = []; // this is a fast look up usernames
// userLookup[userIndex] = array of room indicies
var userLookup = [];

// roomNames[roomIndex] = array of room names
var roomNames = [];
// roomLookup[roomIndex] = array of user indicies
var roomLookup = []; // we need this, to do easy lookup. to see what index the user has in the room
// localUserSettings[roomIndex][roomUserIndex] = UserSettings object
var localUserSettings = []; // but it's also roomLookup

// Sort alphabetically by nick
function userlistSort(u1, u2) {
	var a = u1.nick.toLowerCase();
	var b = u2.nick.toLowerCase();
	if (a < b) return -1;
	else if (a > b) return 1;
	else {
		a = u1.nick;
		b = u2.nick;
		if (a < b) return -1;
		else if (a > b) return 1;
		else return 0;
	}
}

// like String.trim() but on arrays, only null values. Only trim on end
function trimArrayEnd() {
	for (var i = 0; i  < arguments.length; i++) {
		var arr = arguments[i];
		if (!Array.isArray(arr)) continue;
		while (arr[arr.length-1] === null && arr.length > 0) {
			arr.pop();
		}
	}
}

function addUser(user) {
	if (users.indexOf(user) !== -1 || nicks.indexOf(user.nick) !== -1) throw "User "+user.nick+" already exists"; // User already exists
	var nullPos = users.indexOf(null); // read more about this below
	var userIndex = nullPos === -1? users.length : nullPos;
	
	users[userIndex] = user;
	nicks[userIndex] = user.nick;
	userLookup[userIndex] = [];
	return true;
}

function removeUser(user) {
	// From all rooms. No its better to do another function
	console.log("Removing user "+user.nick);
	var userIndex = users.indexOf(user); // user is an instance of User
	if (userIndex === -1) throw "No such user "+user.nick; // No such user

	var userRooms = userLookup[userIndex];

	for (var r = 0; r < userRooms.length; r++) {
		var roomIndex = userRooms[r];
		var roomName = roomNames[roomIndex];
		var roomUserIndex = roomLookup[roomIndex].indexOf(userIndex);
		//leaveRoom(user, roomNames[roomIndex]);
		
		roomLookup[roomIndex].splice(roomUserIndex, 1);
		localUserSettings[roomIndex].splice(roomUserIndex, 1);

		// Room is empty, remove it
		if (roomLookup[roomIndex].length === 0) {
			console.log("Room "+roomName+" is empty, removing it");
			if (roomIndex === roomNames.length - 1) {
				roomNames.pop();
				roomLookup.pop();
				localUserSettings.pop();
			} else {
				roomNames[roomIndex] = null;
				roomLookup[roomIndex] = null;
				localUserSettings[roomIndex] = null;
			}
		}
	}

	if (userIndex === users.length - 1) {
		nicks.pop();
		users.pop();
		userLookup.pop();
	} else {
		nicks[userIndex] = null;
		users[userIndex] = null;
		userLookup[userIndex] = null;
	}
	trimArrayEnd(nicks, users, userLookup, roomNames);

	return true;
}

function joinRoom(user, roomName) {
	console.log(user.nick+" is joining room "+roomName);
	var userIndex = users.indexOf(user);
	if (userIndex === -1) throw "No such user "+user.nick;

	var roomIndex = roomNames.indexOf(roomName);
	if (roomIndex === -1) {
		var nullPos = roomNames.indexOf(null);
		roomIndex = nullPos === -1? roomNames.length : nullPos; // if it didnt find a hole, return the length of the array.
		// nullPos is the position of the first null in the array, a hole. If there are no holes, return the length of the array.

		roomNames[roomIndex] = roomName;
		roomLookup[roomIndex] = [];
		localUserSettings[roomIndex] = [];

	} else if (roomLookup[roomIndex].indexOf(userIndex) !== -1) {
		// User is already in room
		throw "User "+user.nick+" already is in room "+roomName;
	}

	//var nullPos = roomLookup[roomIndex].indexOf(null);
	//var roomUserIndex = nullPos === -1? roomLookup[roomIndex].length : nullPos;

	userLookup[userIndex].push(roomIndex);
	roomLookup[roomIndex].push(userIndex);
	localUserSettings[roomIndex].push(new UserSettings());
	return true;
}

function leaveRoom(user, roomName) {
	console.log(user.nick+" is leaving room "+roomName);
	var userIndex = users.indexOf(user);
	if (userIndex === -1) throw "No such user "+user.nick; // No such user
	var roomIndex = roomNames.indexOf(roomName);
	if (roomIndex === -1) throw "No such room "+roomName; // No such room
	var roomUserIndex = roomLookup[roomIndex].indexOf(userIndex);
	if (roomUserIndex === -1) throw "User "+user.nick+" is not in room "+roomName; // User is not in room
	
	userLookup[userIndex].splice(userLookup[userIndex].indexOf(roomIndex), 1);
	roomLookup[roomIndex].splice(roomUserIndex, 1);
	localUserSettings[roomIndex].splice(roomUserIndex, 1);

	
	// Room is empty, remove it
	if (roomLookup[roomIndex].length === 0) {
		console.log("Room "+roomName+" is empty, removing it");
		if (roomIndex === roomNames.length - 1) {
			roomNames.pop();
			roomLookup.pop();
			localUserSettings.pop();
		} else {
			roomNames[roomIndex] = null;
			roomLookup[roomIndex] = null;
			localUserSettings[roomIndex] = null;
		}
	}

	trimArrayEnd(roomNames, roomLookup, localUserSettings);
	return true;
}

function isUserInRoom(user, roomName) {
	var userIndex = users.indexOf(user);
	if (userIndex === -1) throw "No such user "+user.nick; // No such user
	var roomIndex = roomNames.indexOf(roomName);
	if (roomIndex === -1) throw "No such room "+roomName; // No such room
	var roomUserIndex = roomLookup[roomIndex].indexOf(userIndex);
	return roomUserIndex !== -1;
}

function updateLocalUserSettings(user, roomName, settings) {
	console.log(user.nick+" is updating settings in room "+roomName);
	var userIndex = users.indexOf(user);
	if (userIndex === -1) throw "No such user "+user.nick; // No such user
	var roomIndex = roomNames.indexOf(roomName);
	if (roomIndex === -1) throw "No such room "+roomName; // No such room
	var roomUserIndex = roomLookup[roomIndex].indexOf(userIndex);
	if (roomUserIndex === -1) throw "User "+user.nick+" is not in room "+roomName; // User is not in room

	localUserSettings[roomIndex][roomUserIndex].update(settings);

	return true;
}

function renameUser(user, nick) {
	console.log("Renaming "+user.nick+" to "+nick);
	var userIndex = users.indexOf(user);
	if (userIndex === -1) throw "No such user "+user.nick; // No such user

	user.nick = nick;
	nicks[userIndex] = nick;
	return true;
}


// to see if the structure works, before using it with sockets
var djazz = new User({nick: 'djazz'});
var jammsen = new User({nick: 'jammsen'});
var admin = new User({nick: 'admin'});

addUser(djazz);
addUser(jammsen);
joinRoom(djazz, 'System', new UserSettings({'color': 'orange'}));
joinRoom(djazz, 'Room1', new UserSettings({'color': 'pink'}));
joinRoom(jammsen, 'Room1', new UserSettings({'color': 'navy'}));

leaveRoom(djazz, 'System');
leaveRoom(djazz, 'Room1');
//removeUser(djazz);

addUser(admin);
joinRoom(admin, 'Room1', new UserSettings({'color': 'red'}));

console.log(users);

removeUser(admin);

//leaveRoom(admin, 'Room1');
//leaveRoom(jammsen, 'Room1');

//addUser(djazz);
//addUser(jammsen);


joinRoom(djazz, 'A', 'djazz A');
joinRoom(jammsen, 'A', 'jammsen A');

leaveRoom(jammsen, 'Room1');

leaveRoom(djazz, 'A');

updateLocalUserSettings(jammsen, 'A', {color: 'green'});

removeUser(jammsen);


removeUser(djazz);



// All rooms are empty and there are no users at this point


console.log('users', users);
console.log('nicks', nicks);
console.log('roomNames', roomNames);
console.log('userLookup', userLookup);
console.log('roomLookup', roomLookup);
console.log('localUserSettings', localUserSettings);


// List users in room "Room1", sort it by nick, return the userlist with user object and local settings
// I need to read up on array methods, brb
roomNames.forEach(function (name, id) {
	if (name === null) return;
	console.log("Users in room "+name+":", (roomLookup[id] || [])
		.filter(function (userIndex) {
			return typeof userIndex === 'number';
		})
		.map(function (userIndex) {
			return users[userIndex];
		})
		.sort(userlistSort)
		.map(function (user) {
			var userIndex = users.indexOf(user);
			return user.nick;
			return {nick: user.nick, settings: localUserSettings[id][roomLookup[id].indexOf(userIndex)]}
		})
	);
});

function getUserlist(roomName) {
	var roomIndex = roomNames.indexOf(roomName);
	if (roomIndex === -1) throw "No such room"; // No such room

	var result = {
		room: roomName,
		users: []
	};
	
	result.users = (roomLookup[roomIndex] || [])
		.filter(function (userIndex) {
			return typeof userIndex === 'number';
		})
		.map(function (userIndex) {
			return users[userIndex];
		})
		.sort(userlistSort)
		.map(function (user) {
			var userIndex = users.indexOf(user);
			return {user: user, settings: localUserSettings[roomIndex][roomLookup[roomIndex].indexOf(userIndex)]}
		});
}

function broadcastToVisibleUsers(user, type, data) {
	var currentUserIndex = users.indexOf(user) === -1;
	if (currentUserIndex) throw "No such user"; // No such user
	var sentTo = [];

	console.log("BROADCAST TO ROOMS:", type, data);
	for (var i = 0; i < userLookup[currentUserIndex].length; i++) {
		var roomIndex = userLookup[userIndex][i];

		//data.room = roomNames[roomName];

		for (var j = 0; j < roomLookup[roomIndex]; j++) {
			var userIndex = roomLookup[roomIndex][j];
				
			if (sentTo.indexOf(userIndex) === -1) {
				sentTo.push(userIndex);

				users[userIndex].socket.emit(type, data);
			}
		}
	}
}

io.sockets.on('connection', function (socket) {

	// Can only login once per socket
	socket.once('login', function (info) {

		var nick = info.nick;

		var user = new User({socket: socket, nick: nick});

		socket.emit('nick', user.nick);

		if (addUser(user)) {

			socket.on('joinroom', function (roomName) {
				if (joinRoom(user, roomName)) {
					socket.emit('joined', roomName);
					// send room's userlist
					socket.emit('userlist', getUserlist(roomName));
					// tell others in room that user joins
					io.sockets.in(roomName).emit('joinroom', {
						room: roomName,
						user: user
					});
					socket.join(roomName);
					
				} else {
					socket.emit('error', "You can't join this room");
				}
			});

			socket.on('leaveroom', function (roomName) {
				if (leaveRoom(user, roomName)) {
					socket.emit('left', roomName);
					socket.leave(roomName);
					// tell others in room that user left
					io.sockets.in(roomName).emit('leaveroom', {
						room: roomName,
						nick: user.nick
					});
					
				} else {
					socket.emit('error', "You can't leave this room");
				}
			});

			socket.on('chat', function (info) {
				var roomName = info.room;
				var message = info.message;
				if (isUserInRoom(user, roomName)) {

					io.sockets.in(roomName).emit('chat', {
						room: roomName,
						nick: user.nick,
						message: message
					});

				} else {
					socket.emit('error', "You can't chat in a room you are not in");
				}
			});

			socket.on('upateSettings', function (info) {
				var roomName = info.room;
				var settings = info.settings;
				if (isUserInRoom(user, roomName)) {
					updateLocalUserSettings(user, roomName, settings);
					io.sockets.in(roomName).emit('upateSettings', {
						room: roomName,
						nick: user.nick,
						settings: settings
					});
				} else {
					socket.emit('error', "You can't update your settings in a room you are not in");
				}
			});

			socket.on('rename', function (nick) {
				var oldNick = user.nick;
				if (renameUser(user, nick)) {
					var newNick = user.nick;
					broadcastToVisibleUsers(user, 'rename', {
						oldNick: oldNick,
						newNick: newNick
					});
				} else {
					socket.emit('error', "Unable to rename");
				}
			});

			socket.once('disconnect', function () {
				var rooms = userLookup[users.indexOf(user)]
					.filter(function (roomIndex) {
						return typeof userIndex === 'number';
					})
					.map(function (roomIndex) {
						return roomNames[roomIndex];
					});
				console.log("Disconnect", rooms);

				broadcastToVisibleUsers(user, 'quit', {
					nick: user.nick
				});
				
				removeUser(user);
			});
		} else {
			socket.emit('error', "Login failed");
			socket.disconnect();
		}
	});
});
