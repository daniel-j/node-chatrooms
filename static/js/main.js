
//require(     ['ViewManager', 'LoginManager', 'UserManager', 'ChatManager'], function ( ViewManager,   LoginManager,   UserManager,   ChatManager ) {
(function () {
	'use strict';

	var socket = io.connect('http://'+document.location.host+'/');

	var roomManager = new RoomManager();

	var currentRoom = '';
	var myNick = '';
	var isLoggedIn = false;
	var isOpen = false;
	var connectHidden = false;

	var views    = new ViewManager();
	var login    = new LoginManager();
	var chat     = new ChatManager();
	var userlistContainer = document.getElementById('userlist');

	socket.on('connect', function () {
		login.failed('');
		console.log("CONNECTED!");
		if (myNick !== '') {
			chat.addConsole("Reconnecting...");
			socket.emit('nick', myNick);
		} else {
			login.disable(false);
		}
	});

	socket.on('nick', function (nick) {
		isLoggedIn = true;
		if (!connectHidden) {
			chat.clear();
		}
		login.disable();
		hideConnect();
		chat.enable();
		myNick = nick;
		chat.addConsole("Connected to server");
		//userlist.clear();
		roomManager.clearUserlists();

		socket.emit('joinroom', 'default');
		
	});

	// You joined a room, different packets
	socket.on('joinroom', function (info) {
		console.log('JOINED A ROOM', info);
		var name = info.room;
		
		roomManager.createRoomFromList(name, info.userlist.users);

		changeRoom(name);
		
		chat.addConsole('You joined room '+currentRoom);
	});

	// Someone else joined a room
	socket.on('join', function (info) {
		console.log("SOMEONE JOINED");
		var user = roomManager.joinRoom(info.room, info.user); // Creates a user
		var room = info.room;
		chat.addConsole('<strong>'+utils.html2text(user.nick)+'</strong> joined room '+room);
	});

	// Someone left a room, yeah i guess. check against username? use getByNick
	// Leaving a room = user still exist, user requested to leave a room
	socket.on('leave', function (info) {

		var user = roomManager.users[info.nick];
		console.log("LEAVE:", user);
		chat.addConsole('<strong>'+utils.html2text(user.nick)+'</strong> left the room '+info.room);
		roomManager.leaveRoom(info.room, user);
		if (user.nick === myNick && currentRoom === info.room) {
			console.log("I left current room", user.rooms);
			changeRoom(user.rooms[user.rooms.length-1].name);
		}
	});

	// Quit = remove user from all rooms
	socket.on('quit', function (info) {
		console.log("SOMEONE QUIT");
		
		var user = roomManager.users[info.nick];
		chat.addConsole('<strong>'+utils.html2text(user.nick)+'</strong> left the server');
		roomManager.leaveAllRooms(user);

	});

	socket.on('chat', function (info) {
		console.log(info);
		var timestamp = new Date(info.timestamp);
		var user = roomManager.getRoomByName(info.room).userlist.getByNick(info.nick);
		chat.addChat(user, utils.html2text(info.message), timestamp);
	});
	socket.on('errorMessage', function (message) {
		if (isLoggedIn) {
			chat.addConsole(message, 'error');
		} else {
			login.failed(message);
		}
	});

	function hideConnect() {
		views.addStateFor('connect', 'top');
		views.removeStateFor('chat', 'behind');
		connectHidden = true;
	}
	function showConnect() {
		views.removeStateFor('connect', 'top');
		views.addStateFor('chat', 'behind');
		connectHidden = false;
	}

	function changeRoom(name) {
		var room = roomManager.getRoomByName(currentRoom);
		if (room) {
			var userlistNode = room.userlist.userlist;
			if (userlistNode.parentNode) {
				userlistContainer.removeChild(userlistNode);
			}
		}
		currentRoom = name;
		room = roomManager.getRoomByName(currentRoom);

		console.log("New room: ", currentRoom, room);
		
		userlistNode = room.userlist.userlist;
		
		userlistContainer.appendChild(userlistNode);
		chat.addConsole("You are now in room "+currentRoom);
	}
	
	socket.on('disconnect', function () {
		console.log("DISCONNECTED");
		if (isLoggedIn) {
			chat.disable();
			chat.addConsole("Disconnected from server", 'error');
		} else {
			login.failed("Unable to connect to server");
		}
	});

	socket.on('error', function (e) {
		//alert("WebSocket error");
		console.log(e);
	});

	login.loginAttemptCallback = function (nick) {

		myNick = nick;

		console.log("LOGGING IN...");

		socket.emit('nick', myNick);

		isLoggedIn = false;
	}

	chat.sendChatCallback = function (message) {
		if (message.indexOf('/join ') === 0) {
			var name = message.substr(6).trim(); // also, alphanumeric etc...
			var rooms = roomManager.users[myNick].rooms;
			for (var i = 0; i < rooms.length; i++) {
				if (rooms[i].name === name) {
					break;
				}
			}
			if (i === rooms.length) {
				socket.emit('joinroom', name);
			} else {
				changeRoom(name);
			}

		} else if(message.indexOf('/leave') === 0) {
			//var name = message.substr(7).trim();
			if (currentRoom !== 'default') {
				socket.emit('leaveroom', currentRoom);
			}
		} else {
			console.log("Sending chat to room " + currentRoom);
			socket.emit('chat', {room: currentRoom, message: message});
		}
	}
}());
//});