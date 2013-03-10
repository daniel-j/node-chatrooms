#!/usr/bin/env node
'use strict';

var port = 8080;

var http = require('http');
var express = require('express');
var WebSocketServer = require('ws').Server;
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
var wss = new WebSocketServer({server: server});

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

wss.on('connection', function (ws) {

	ws._socket.setTimeout(60*1000);

	ws._socket.once('timeout', function () {
		console.log('TIMEOUT!');
		ws.close();
	});

	console.log("CONNECT protocol: "+ws.protocol+" version: "+ws.protocolVersion+" supports: "+ws.supports+" origin: "+ws.upgradeReq.headers.origin);

	var user = new User({socket: ws});

	function handleData(data) {

		if (typeof data.nick !== 'undefined' && data.nick.length > 0) {

			// Remove surrounding whitewpace.. might add more limitations later on
			var nick = fixNick(data.nick);

			if (!user.ready) { // New user
				
				console.log(nick+' is trying to join');

				if (nickExists(nick)) {

					// sendError closes socket
					sendError(ws, "Nick is in use");
					ws.close();
					return;

				} else {
					
					// Save nick
					user.update({nick: nick, ready: true});

					users.push(user);

					console.log(nick+' joined');

					// Send userlist and new nick to joining user
					sendPacket(ws, {
						nick: user.nick,
						userlist: getUserlist()
					});

					// Send join notification to all other users
					broadcastPacket({
						join: user
					}, ws);
				}

			} else { // User changed nick

				if (!nickExists(nick)) { // No other user with this nick

					user.update({nick: nick});

					// Notify other users
					broadcastPacket({
						update: {
							nick: nick
						},
						index: users.indexOf(user)
					});


				} else { // Nick exists
					
					sendConsole(ws, "<strong>Nick is in use</strong>");

				}

			}
		}
		// Ready = user is visible in userlist and can send/recieve chat
		// It is so that the user dont recieve chat before getting the join confirmation and userlist
		// Page load = connect to the default room? Without being visible?
		// He dont need a nick until he can chat. yeah hmm. people in the chat cant know who's "spying"?
		// I like the irc way.
		if (user.ready) {

			if (typeof data.chat !== 'undefined') {
				var message = data.chat;
				broadcastPacket({
					chat: message,
					timestamp: new Date(),
					index: users.indexOf(user)
				});
			}
	
		}
	}

	// Got a packet from client
	ws.on('message', function (message, flags) {

		console.log("RECIEVED from "+(user.nick || 'guest')+":", message);

		var data;

		// Invalid JSON will not crash the server
		try {
			data = JSON.parse(message);
		} catch (e) {
			var err = "JSON error "+message+" "+e.toString();
			console.log(err);

			sendError(ws, err);
		}

		// Try-catch statements deoptimizes, handle data in other function
		if (data) {
			handleData(data);
		}
		

	});

	// Client got disconnected
	ws.on('close', function () {
		console.log("CLOSE "+(user.nick || 'guest'));
		var index = users.indexOf(user);
		if (user.ready && index !== -1) {
			broadcastPacket({
				leave: index
			}, ws);
			console.log(user.nick+' left');
		}

		// Remove user from array
		users.splice(index, 1);
	});
	
	ws.on('error', function () {
		console.log('ERROR', arguments);
	});
});