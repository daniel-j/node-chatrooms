'use strict';

var port = 9001;

var http = require('http');
var express = require('express');
var WebSocketServer = require("ws").Server;
var url = require('url');

var app = express();
app.use(express.static(__dirname + '/static'));
var server = http.createServer(app);
server.listen(port, function () {
	console.log("Chatroom server started on port "+port);
});

var wss = new WebSocketServer({server: server});

var sockets = [];
var users = [];

function fillZero (val) {
	if(val > 9) return ""+val;
	return "0"+val;
};
function timestamp () {
	var now = new Date();
	return "["+fillZero(now.getHours())+":"+fillZero(now.getMinutes())+":"+fillZero(now.getSeconds())+"]";
};

var broadcast = function (obj, except) {
	var l = sockets.length;
	var data = JSON.stringify(obj);
	if(typeof(except)==='undefined') except = -1;
	for(var i=0; i < l; i+=1) {
		if(except!==i && sockets[i] !== undefined) {
			sockets[i].send(data);
		}	
	}
};
var send = function (index, obj) {
	sockets[index].send(JSON.stringify(obj));
};
var joinChannel = function (index, channel) {
	channel = channel.toLowerCase();
	users[index].channels.push(channel);
	var l = sockets.length;
	var userlist = [];
	var data = JSON.stringify({'joiner': users[index], 'channel': channel});
	for(var i=0; i < l; i+=1) {
		if(sockets[i] !== undefined && users[i].channels.indexOf(channel) !== -1) {
			if(index!==i) {
				sockets[i].send(data);
			}
			userlist.push(users[i]);
		}
	}
	send(index, {'userlist': userlist, 'channel': channel});
};
var leaveChannel = function (index, channel) {
	channel = channel.toLowerCase();
	users[index].channels.splice(users[index].channels.indexOf(channel), 1);
	var data = JSON.stringify({'leaver': users[index].id, 'channel': channel});
	var l = sockets.length;
	for(var i=0; i < l; i+=1) {
		if(sockets[i] !== undefined && users[i].channels.indexOf(channel) !== -1) {
			if(index!==i) {
				sockets[i].send(data);
			}
		}
	}
};

var leaveAllChannels = function (index) {
	var channels = users[index].channels;
	while(channels.length > 0) {
		leaveChannel(index, users[index].channels[0]);
	}
};


wss.on('connection', function (websocket) {
	console.log("Connection!");
	var username = url.parse(websocket.upgradeReq.url, true).query.username;
	// Someone connected
	var index = -1;
	for(var i=0; i < sockets.length; i+=1) {
		if(typeof(sockets[i])==='undefined') {
			index = i;
			break;
		}
	}
	if(index === -1) {
		index = sockets.length;
	}
	console.log(timestamp()+" client "+websocket._socket.remoteAddress+" ("+index+") connected");
	sockets[index] = websocket;
	users[index] = {'name': username, 'channels': [], 'id': index};
	send(index, {'me': {'name': users[index].name, 'id': users[index].id}});

	websocket.on("message", function (data) {
		var index = sockets.indexOf(websocket);
		data = JSON.parse(data);
		if(data['join'] !== undefined) {
			joinChannel(index, data['join']);
		}
		else if(data.leave !== undefined) {
			leaveChannel(index, data.leave);
		}
		else if(data.chat !== undefined) {
			broadcast({'chat': data.chat.replace(/\</g, "&lt;").replace(/\>/g, "&gt;"), 'channel': data.channel, 'who': index});
		}
	}).on("close", function () {
		var index = sockets.indexOf(websocket);
		leaveAllChannels(index);
		console.log(timestamp()+" client "+websocket.remoteAddress+" ("+index+") left");
		sockets[index] = undefined;
		users[index] = undefined;
	}).on("error", function (err) {
		var index = sockets.indexOf(websocket);
		console.log(err);
	});
});

