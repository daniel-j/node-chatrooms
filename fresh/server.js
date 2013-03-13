#!/usr/bin/env node
'use strict';

var port = 9003;

var http = require('http');
var express = require('express');
var userManager = new require('./static/UserManager');

var app = express();
app.use(express.static(__dirname + '/static'));
var server = http.createServer(app);
server.listen(port, function () {
	console.log("Chat server started on port "+port);
});
var io = require('socket.io').listen(server);

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
	this.color = config.color || 'blue';

	this.update = function (settings) {
		for (var i in settings) {
			if (settings.hasOwnProperty(i)) {
				this[i] = settings[i];
			}
		}
	}
}

// to see if the structure works, before using it with sockets
/*var djazz = new User({nick: 'djazz'});
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


removeUser(djazz);*/



// All rooms are empty and there are no users at this point


/*console.log('users', users);
console.log('nicks', nicks);
console.log('roomNames', roomNames);
console.log('userLookup', userLookup);
console.log('roomLookup', roomLookup);
console.log('localUserSettings', localUserSettings);*/


// List users in room "Room1", sort it by nick, return the userlist with user object and local settings
// I need to read up on array methods, brb
userManager.roomNames.forEach(function (name, id) {
	if (name === null) return;
	console.log("Users in room "+name+":", (userManager.roomLookup[id] || [])
		.filter(function (userIndex) {
			return typeof userIndex === 'number';
		})
		.map(function (userIndex) {
			return userManager.users[userIndex];
		})
		.sort(userlistSort)
		.map(function (user) {
			var userIndex = userManager.users.indexOf(user);
			return user.nick;
			return {nick: user.nick, settings: userManager.localUserSettings[id][userManager.roomLookup[id].indexOf(userIndex)]}
		})
	);
});

function isAllReadyInRoom(roomName, maxPlayers) {
	var roomIndex = userManager.roomNames.indexOf(roomName);
	if (roomIndex === -1) throw "No such room"; // No such room
	var blueCount = 0;
	var redCount = 0;
	for (var i = 0; i < userManager.roomLookup[roomIndex].length; i++) {
		var userIndex = userManager.roomLookup[roomIndex][i];
		var roomUserIndex = userManager.roomLookup[roomIndex].indexOf(userIndex);
		var settings = userManager.localUserSettings[roomIndex][roomUserIndex];
		if (settings.ready) {
			if (settings.color === 'blue') {
				blueCount++;
			} else {
				redCount++;
			}
			if (blueCount >= maxPlayers/2 && redCount >= maxPlayers/2) {
				return true;
			}
		}

	}
	return false;
}

function getUserlist(user, roomName) {
	var roomIndex = userManager.roomNames.indexOf(roomName);
	if (roomIndex === -1) throw "No such room"; // No such room

	var result = {
		room: roomName,
		users: []
	};
	
	result.users = (userManager.roomLookup[roomIndex] || [])
		.filter(function (userIndex) {
			return typeof userIndex === 'number' && userManager.users[userIndex] !== user;
		})
		.map(function (userIndex) {
			return userManager.users[userIndex];
		})
		.sort(userlistSort)
		.map(function (user) {
			var userIndex = userManager.users.indexOf(user);
			return {user: user, settings: userManager.localUserSettings[roomIndex][userManager.roomLookup[roomIndex].indexOf(userIndex)]}
		});
	return result;
}

function broadcastToVisibleUsers(user, type, data, except) {
	var currentUserIndex = userManager.users.indexOf(user);
	if (currentUserIndex === -1) throw "No such user"; // No such user
	var sentTo = [];

	console.log("BROADCAST TO "+user.nick+"'s VISIBLE USERS:", type, data);
	for (var i = 0; i < userManager.userLookup[currentUserIndex].length; i++) {
		var roomIndex = userManager.userLookup[currentUserIndex][i];



		for (var j = 0; j < userManager.roomLookup[roomIndex].length; j++) {
			var userIndex = userManager.roomLookup[roomIndex][j];
			
			if (sentTo.indexOf(userIndex) === -1 && userManager.users[userIndex] !== except) {
				sentTo.push(userIndex);

				userManager.users[userIndex].socket.emit(type, data);
				console.log('Sending to '+userManager.users[userIndex].nick);
			}
		}
	}
}

function updateRoomReadyState(roomName) {
	var settings = userManager.getRoomSettings(roomName);

	if (settings.maxPlayers !== undefined) {
		var newVal = isAllReadyInRoom(roomName, settings.maxPlayers);
	} else {
		var newVal = false;
	}

	if (settings.allReady !== newVal) {
		settings.allReady = newVal;
		io.sockets.in(roomName).emit('console', {
			room: roomName,
			message: "*** All players are "+(newVal? '':'not ')+'ready ***'
		});
	}
}

var counter = 0;

io.set('log level', 1);
io.sockets.on('connection', function (socket) {

	

	var hasLoggedIn = false;

	// Can only login once per socket
	socket.on('login', function (info) {
		if (hasLoggedIn) return;

		var nick = info.nick;

		// Do isValidNick check here
		//socket.emit('warning', 'Invalid username');
		//return;
		//nick = 'guest-'+(++counter);

		console.log(nick+" logs in from "+socket.handshake.address.address);
		var user = new User({socket: socket, nick: nick});

		if (userManager.addUser(user)) {
			socket.emit('welcome', {nick: user.nick});
			hasLoggedIn = true;

			socket.on('roomsettings', function (info) {
				var change = info.settings;
				var roomName = info.room;
				if (userManager.isUserInRoom(user, roomName)) {
					console.log("Got room settings!", change);
					var settings = userManager.roomSettings[userManager.roomNames.indexOf(roomName)];
					for (var i in change) {
						if (change.hasOwnProperty(i)) {
							settings[i] = change[i];
						}
					}
					updateRoomReadyState(roomName);
					io.sockets.in(roomName).emit('roomsettings', {
						room: roomName,
						settings: change
					});
				} else {
					socket.emit('warning', "You are not in this room");
				}
			});

			socket.on('joinroom', function (roomName) {
				var settings = new UserSettings();
				if (userManager.joinRoom(user, roomName, settings)) {
					// send room's userlist
					var info = getUserlist(user, roomName);
					info.settings = userManager.roomSettings[userManager.roomNames.indexOf(roomName)];
					socket.emit('joinedroom', info);
					// tell others in room that user joins
					io.sockets.in(roomName).emit('joinroom', {
						room: roomName,
						nick: user.nick,
						settings: settings
					});
					socket.join(roomName);
					
				} else {
					socket.emit('warning', "You can't join this room");
				}
			});

			socket.on('leaveroom', function (roomName) {
				if (roomName !== 'system' && userManager.leaveRoom(user, roomName)) {
					socket.emit('leftroom', roomName);
					socket.leave(roomName);
					// tell others in room that user left
					io.sockets.in(roomName).emit('leaveroom', {
						room: roomName,
						nick: user.nick
					});

					updateRoomReadyState(roomName);

					
				} else {
					socket.emit('warning', "You can't leave this room");
				}
			});

			socket.on('chat', function (info) {
				var roomName = info.room;
				var message = info.message;
				if (userManager.isUserInRoom(user, roomName)) {

					io.sockets.in(roomName).emit('chat', {
						room: roomName,
						nick: user.nick,
						message: message
					});

				} else {
					socket.emit('warning', "You can't chat in a room you are not in");
				}
			});

			socket.on('upatesettings', function (info) {
				var roomName = info.room;
				var settings = info.settings;
				if (userManager.isUserInRoom(user, roomName)) {
					console.log('Updating settings for '+user.nick+' in room '+roomName, settings);
					userManager.updateLocalUserSettings(user, roomName, settings);

					updateRoomReadyState(roomName);

					io.sockets.in(roomName).emit('upatesettings', {
						room: roomName,
						nick: user.nick,
						settings: settings
					});
				} else {
					socket.emit('warning', "You can't update your settings in a room you are not in");
				}
			});

			socket.on('rename', function (nick) {
				var oldNick = user.nick;
				if (userManager.renameUser(user, nick)) {
					var newNick = user.nick;
					broadcastToVisibleUsers(user, 'rename', {
						oldNick: oldNick,
						newNick: newNick
					});
				} else {
					socket.emit('warning', "Unable to rename");
				}
			});

			socket.on('disconnect', function () {
				var rooms = userManager.userLookup[userManager.users.indexOf(user)]
					.map(function (roomIndex) {
						var roomName = userManager.roomNames[roomIndex];
						updateRoomReadyState(roomName);
						return roomName;
					});
				console.log(user.nick+" disconnected", rooms);

				broadcastToVisibleUsers(user, 'quit', {
					nick: user.nick
				}, user);
				
				userManager.removeUser(user);

			});
		} else {
			socket.emit('warning', "Login failed");
			socket.disconnect();
		}
	});
});
