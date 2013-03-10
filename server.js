#!/usr/bin/env node
'use strict';

var port = 9000;

var http = require('http');
var express = require('express');
var RoomManager = require(__dirname + '/static/js/RoomManager.js');
var User = require(__dirname + '/static/js/User.js');

//var reqjs = require('requirejs');
// This module is shared between server and client, using require.js
//var User = reqjs('static/js/User');

var app = express();
app.use(express.static(__dirname + '/static'));
var server = http.createServer(app);
server.listen(port, function () {
	console.log("Chat server started on port "+port);
});
var io = require('socket.io').listen(server);

var roomManager = new RoomManager(io);

var users = [];

// overkill? no, just structue!

// structure:
/*rooms = {
	roomName: {
		users: [user1, user2, user3],
		states: [settings, true, state for user 3],

	}
}*/
// how can a user have different settings in different rooms? other team, ready or not ready..
// in js objects are references.. if i change one user object in one room, it also changes in the other rooms
// the user is in. :P we'll figure out that later


function sendError(socket, message) {
	socket.emit('errorMessage', message);
	//socket.disconnect();
}
function sendConsole(socket, message) {
	socket.emit('console', message);
}

// TODO: finish
function broadcastToRooms(user, type, data) {
	console.log("BROADCAST TO ROOMS:", type, data);
	for (var i = 0; i < users.length; i++) {
		if (users[i].nick !== '') {
			//console.log(users[i].nick, users[i].rooms.length, user.rooms.length);
			for (var j = 0; j < user.rooms.length; j++) {
				if (users[i].rooms.indexOf(user.rooms[j]) !== -1) {
					//data.room = user.rooms[j];
					data.room = user.rooms[j].name;
					users[i].socket.emit(type, data);
					//console.log("SENT "+type+" TO "+users[i].nick);
					break; // dont send anymore to this user
				}
			}
			
		}
	}
}

// will the program run? ;)
// yay no syntax errors


function nickExists(nick) {
	for (var i = 0; i < users.length; i++) {
		if (nick.toLowerCase() === users[i].nick.toLowerCase()) {
			return true;
		}
	}
	return false;
}
function fixNick(nick) {
	// Remove surrounding whitespace.. might add more limitations later on, such as only alphanumeric
	return nick.trim().replace(/[^a-z0-9\-_]/ig, '');
}

io.set('log level', 1);

io.sockets.on('connection', function (socket) {

	//console.log("CONNECT");

	// scoped to user
	// init code
	var user = new User({socket: socket});
	

	socket.on('joinroom', function (name) {
		roomManager.joinRoom(name, user);
	});

	socket.on('leaveroom', function (name) {
		roomManager.leaveRoom(name, user);
	});

	socket.on('nick', function (orig_nick) {

		var nick = fixNick(orig_nick);
		
		if (nick.length > 0 && orig_nick === nick) {

			if (user.nick === '') { // New user
				
				console.log(nick+' is trying to join');

				if (nickExists(nick)) {

					// sendError closes socket
					sendError(socket, "Nick is in use");

				} else {
					
					// Save nick
					var config = {
						nick: nick
					};
					user.update(config);
					// dont broadcast here, it's a join

					users.push(user);

					console.log(nick+' joined with a valid nickname');

					//roomManager.joinRoom('system', user, {});

					// Send userlist and new nick to joining user
					socket.emit('nick', user.nick);
					//socket.emit('userlist', getUserlist());

					// Send join notification to all other users
					//socket.broadcast.emit('join', user);
				}

			} else { // User changed nick

				if (!nickExists(nick)) { // No other user with this nick

					var oldNick = user.nick;

					user.update({nick: nick}); // let's do it here instead

					broadcastToRooms(user, 'update', {
						newNick: nick,
						nick: oldNick
					});

					// Notify all users
					/*io.sockets.emit('update', {
						nick: nick,
						index: users.indexOf(user)
					});*/

				} else { // Nick exists
					
					sendConsole(socket, "<strong>Nick is in use</strong>");
				}

			}
		} else {
			sendError(socket, "Invalid nickname. Only alphanumeric characters and - and _");
		}
	});
	
	socket.on('chat', function (data) {
		if (user.nick !== '') {
			var message = data.message;
			var roomName = data.room;

			roomManager.emitToRoom(roomName, 'chat', {
				message: message,
				timestamp: new Date(),
				nick: user.nick, // no index anymore! yay! it will be hard because user have different index in different rooms
				room: roomName
			});
		}
	});

	// Client got disconnected
	socket.on('disconnect', function () {
		
		var index = users.indexOf(user);

		if (user.nick !== '') {

			console.log("CLOSE "+(user.nick || 'guest'));
			
			console.log(user.nick+' left');
			broadcastToRooms(user, 'quit', {nick: user.nick});
			roomManager.leaveAllRooms(user);
		}
		
		if (index !== -1) {
			// Remove user from array
			users.splice(index, 1);
		}
	});
	
	socket.on('error', function () {
		console.log('ERROR', arguments);
	});
});