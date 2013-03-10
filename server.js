#!/usr/bin/env node
'use strict';

var port = 8080;

var http = require('http');
var express = require('express');
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

var users = [];

function sendData(ws, data) {
	try {
		ws.send(data);
	} catch (e) {
		console.error("Couldn't send!", e);
		ws.close();
	}
}
function sendPacket(ws, obj) {
	var data = JSON.stringify(obj);
	sendData(ws, data);
	console.log("SEND to a user:", data);
}
function sendError(ws, message) {
	sendPacket(ws, {error: message});
	ws.close();
}
function sendConsole(ws, message) {
	sendPacket(ws, {console: message});
}

// Only broadcast to "authenticated" users (user.ready === true)
function broadcastPacket(obj, except) {
	var data = JSON.stringify(obj);
	console.log("BROADCAST SEND:", data);
	for (var i = 0; i < users.length; i++) {
		if (users[i].socket !== except && users[i].ready) {
			sendData(users[i].socket, data);
		}
	}
}

function getUserlist() {
	return users.filter(function (user) {
		return user.ready;
	});
}

function nickExists(nick) {
	for (var i = 0; i < users.length; i++) {
		if (nick.toLowerCase() === users[i].nick.toLowerCase()) {
			return true;
		}
	}
	return false;
}
function fixNick(nick) {
	return nick.trim();
}

io.sockets.on('connection', function (socket) {

	console.log("CONNECT");

	var user = new User({socket: socket});

	socket.on('nick', function (nick) {
		if (nick.length > 0) {

			// Remove surrounding whitespace.. might add more limitations later on, such as only alphanumeric
			nick = fixNick(nick);

			if (!user.ready) { // New user
				
				console.log(nick+' is trying to join');

				if (nickExists(nick)) {

					// sendError closes socket
					sendError(socket, "Nick is in use");
					socket.close();
					return;

				} else {
					
					// Save nick
					user.update({
						nick: nick,
						ready: true
					});

					users.push(user);

					console.log(nick+' joined');

					// Send userlist and new nick to joining user
					socket.emit('nick', user.nick);
					socket.emit('userlist', getUserlist());

					// Send join notification to all other users
					socket.broadcast.emit('join', user);
				}

			} else { // User changed nick

				if (!nickExists(nick)) { // No other user with this nick

					user.update({nick: nick});

					// Notify all users
					io.sockets.emit('update', {
						nick: nick,
						index: users.indexOf(user)
					});


				} else { // Nick exists
					
					sendConsole(socket, "<strong>Nick is in use</strong>");

				}

			}
		}
	});

	function handleData(data) {

		

		if (user.ready) {
			if (typeof data.chat !== 'undefined') {
				var message = data.chat;
				io.sockets.emit('chat', {
					message: message,
					timestamp: new Date(),
					index: users.indexOf(user)
				});
			}
		}
	}

	// Got a packet from client
	socket.on('message', function (data) {

		console.log("RECIEVED from "+(user.nick || 'guest')+":", data.toString());
		
		handleData(data);
	});

	// Client got disconnected
	socket.on('disconnect', function () {
		console.log("CLOSE "+(user.nick || 'guest'));
		var index = users.indexOf(user);
		if (user.ready && index !== -1) {
			socket.broadcast.emit('left', index);
			console.log(user.nick+' left');
		}

		// Remove user from array
		users.splice(index, 1);
	});
	
	socket.on('error', function () {
		console.log('ERROR', arguments);
	});
});