var http = require('http');
var server = http.createServer(function(request, response) {
	response.writeHead(200, {
		'Content-Type': 'text/plain'
	});
});
var io = require('socket.io').listen(server);
server.listen(5000);

var usernames = [];
var rooms = []; // yeah correct

io.sockets.on('connection', function(socket) {
	


	socket.on('adduser', function(config){
		console.log(config);
		var gamename = config.room;
		if(rooms.indexOf(gamename) === -1) {
			rooms.push(gamename);
		}
		socket.room = gamename;
		socket.team = config.team;
		socket.ready = config.ready;
		socket.join(gamename);

		var username = config.username;

		if(usernames.indexOf(username) === -1) {
			socket.username = username;
			if (!usernames[socket.room]) usernames[socket.room] = [];
			usernames[socket.room].push(config);
			io.sockets.in(socket.room).emit('updatechat', 'SERVER', username+ ' joined');
			io.sockets.in(socket.room).emit('updateplayer', usernames);
			socket.emit('updatechat', 'SERVER', 'You joined '+socket.room);
		}
	});
	socket.on('sendchat', function (data) {
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});

	/*socket.on('changeroom', function (gamename) {
		io.sockets.in(socket.room).emit('updatechat', 'SERVER', socket.username+' left');
		socket.leave(socket.room);

		socket.room = gamename;
		socket.join(gamename);

		// we can do this later, not now. implement clientside first
		// how will the gamenames look like? 2CKq0ETOe8Ug1Ff4
		// simplify/search rooms?
	});*/

	socket.on('disconnect', function() {
		console.log(usernames, socket.room);
		var index = usernames[socket.room].indexOf(socket.username);
		usernames[socket.room].splice(index, 1);
		io.sockets.emit('updateusers', usernames);
		io.sockets.in(socket.room).emit('updatechat', 'SERVER', socket.username+' left');
		socket.leave(socket.room);

		// Remove room if room has no users?
		if (io.sockets.clients(socket.room).length === 0) {
			rooms.splice(rooms.indexOf(socket.room), 1);
			console.log("Destroyed room");
		}
	});
});