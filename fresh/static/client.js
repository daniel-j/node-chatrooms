
(function () {
	'use strict';

	function User(config) {
		this.nick = config.nick || '';

		this.update = function (config) {
			for (var i in config) {
				if (config.hasOwnProperty(i)) {
					this[i] = config[i];
				}
			}
		}
	}

	function UserSettings(config) {
		config = config || {};
		this.ready = !!config.ready;
		this.color = config.color || 'blue';
		this.opt = config.opt || new Option();

		this.update = function (settings) {
			for (var i in settings) {
				if (settings.hasOwnProperty(i)) {
					this[i] = settings[i];
				}
			}
		}
	}

	var myUser = null;
	var userManager = null;
	var myRooms = [];
	var currentRoom = null;
	var chatLogs = [];
	var mySettings = [];

	var chatForm = document.getElementById('chatForm');
	var chatInput = document.getElementById('chatInput');

	var selectRooms = document.getElementById('selectRooms');
	var selectUserlistBlue = document.getElementById('selectUserlistBlue');
	var selectUserlistRed = document.getElementById('selectUserlistRed');

	var leaveRoomBtn = document.getElementById('leaveRoom');
	var joinRoomBtn = document.getElementById('joinRoom');
	var colorpicker = document.getElementById('colorpicker');
	var toggleReady = document.getElementById('toggleReady');

	var chatlogsdiv = document.getElementById('chatlogs');

	gatherRoomSettings.settings.allReady = false;

	function changeRoom(roomName) {

		var myRoomIndex = myRooms.indexOf(currentRoom);
		if (chatLogs[myRoomIndex] && chatLogs[myRoomIndex].parentNode === chatlogsdiv) {
			chatlogsdiv.removeChild(chatLogs[myRoomIndex]);
		}

		console.log("Chat is now going to "+roomName);
		currentRoom = roomName;

		myRoomIndex = myRooms.indexOf(currentRoom);

		if (myRoomIndex !== -1) {
			chatlogsdiv.appendChild(chatLogs[myRoomIndex]);
			chatLogs[myRoomIndex].scrollTop = chatLogs[myRoomIndex].scrollHeight;
			selectRooms.selectedIndex = myRoomIndex;
			for (var i = 0; i < colorpicker.options.length; i++) {
				console.log(colorpicker.options[i].value, mySettings[myRoomIndex].color);
				if (colorpicker.options[i].value === mySettings[myRoomIndex].color) {

					colorpicker.selectedIndex = i;
					break;
				}
			}
			toggleReady.checked = mySettings[myRoomIndex].ready;
		}

		selectUserlistBlue.options.length = 0;
		selectUserlistRed.options.length = 0;
		var roomIndex = userManager.roomNames.indexOf(roomName);
		(userManager.roomLookup[roomIndex] || []).forEach(function (userIndex) {
			if (typeof userIndex !== 'number') return;
			var roomUserIndex = userManager.roomLookup[roomIndex].indexOf(userIndex);
			var user = userManager.users[userIndex];

			var settings = updateUserOptionSettings(user, roomName, {});
			
		});

	}

	function addChatNode(node, roomName) {
		console.log(roomName);
		var log = chatLogs[myRooms.indexOf(roomName)];
		var wasAtBottom = log.scrollTop >= log.scrollHeight - log.offsetHeight - 20;
		log.appendChild(node);
		if (wasAtBottom) { // Only scroll if the scrollbar is at bottom
			log.scrollTop = log.scrollHeight;
		}
	}
	function addConsoleMessage(html, roomName) {
		var node = document.createElement('div');
		node.className = 'console';
		node.innerHTML = html;
		addChatNode(node, roomName);
	}

	function updateUserOptionSettings(user, roomName, change) {
		var userIndex = userManager.users.indexOf(user);
		var roomIndex = userManager.roomNames.indexOf(roomName);
		var roomUserIndex = userManager.roomLookup[roomIndex].indexOf(userIndex);

		userManager.updateLocalUserSettings(userManager.userByNick(user.nick), roomName, change);

		var userSettings = userManager.localUserSettings[roomIndex][roomUserIndex];

		var opt = userSettings.opt;

		opt.style.color = userSettings.ready? 'green' : userSettings.color;
		opt.textContent = userSettings.ready? '[*] '+user.nick : user.nick;
		opt.value = user.nick;

		if (opt.parentNode) {
			opt.parentNode.removeChild(opt);
		}

		if (userSettings.color === 'blue') {
			selectUserlistBlue.add(opt, null);
		} else {
			selectUserlistRed.add(opt, null);
		}

		return userSettings;
	}

	var socket = io.connect('http://'+document.location.host+'/');

	socket.on('connect', function () {

		console.log('Connected');
		socket.emit('login', {nick: gatherUsername});

		socket.once('welcome', function (info) {
			var nick = info.nick;

			myUser = new User({nick: nick});
			userManager = new UserManager(myUser);
			socket.emit('joinroom', 'system'); // this is the easiest way, with the current implementation
			socket.emit('joinroom', gatherRoomSettings.room);
		});
	});

	socket.on('joinedroom', function (info) {
		var roomName = info.room;
		var list = info.users;
		var settings = new UserSettings();
		// You joined a room

		if (roomName === gatherRoomSettings.room && Object.keys(info.settings).length === 0) {

			socket.emit('roomsettings', gatherRoomSettings);
		}
		
		console.log("You joined "+roomName, list);
		userManager.joinRoom(myUser, roomName, settings);

		for (var i = 0; i < list.length; i++) {
			var userIndex = userManager.nicks.indexOf(list[i].user.nick);
			if (userIndex === -1) {
				var user = new User(list[i].user);
				userManager.addUser(user);
				userIndex = userManager.users.indexOf(user);
			}
			userManager.joinRoom(userManager.users[userIndex], roomName, new UserSettings(list[i].settings));
		}
		selectRooms.add(new Option(roomName, roomName), null);
		myRooms.push(roomName);
		chatLogs.push(document.createElement('div'));
		mySettings.push(settings);
		changeRoom(roomName);

		addConsoleMessage("<strong>Welcome to "+roomName+", "+myUser.nick+"</strong>", roomName);
	});
	socket.on('leftroom', function (roomName) {
		// You left a room
		console.log("You left "+roomName);
		userManager.leaveRoom(myUser, roomName);
		var myRoomIndex = myRooms.indexOf(roomName);
		myRooms.splice(myRoomIndex, 1);
		selectRooms.remove(myRoomIndex);
		chatlogsdiv.removeChild(chatLogs[myRoomIndex]);
		chatLogs.splice(myRoomIndex, 1);
		mySettings.splice(myRoomIndex, 1);

		if (myRooms[myRoomIndex]) {
			changeRoom(myRooms[myRoomIndex]);
		} else {
			changeRoom(myRooms[myRoomIndex-1]);
		}
	});

	socket.on('joinroom', function (info) {
		// Someone joins a room
		var roomName = info.room;
		var nick = info.nick;

		var userIndex = userManager.nicks.indexOf(nick);
		if (userIndex === -1) {
			var user = new User({nick: nick});
		} else {
			var user = userManager.users[userIndex];
		}
		
		var settings = new UserSettings(info.settings);
		userManager.joinRoom(user, roomName, settings);
		if (currentRoom === roomName) {
			updateUserOptionSettings(user, roomName, settings);
			//selectUserlist.add(opt, null);
		}
		addConsoleMessage("<strong>"+user.nick+" joined</strong>", roomName);
	});
	socket.on('leaveroom', function (info) {
		// Someone leaves a room
		var roomName = info.room;
		var nick = info.nick;
		var user = userManager.userByNick(nick);
		userManager.leaveRoom(user, roomName);

		// TODO: Improve this code:

		var found = false;
		for (var i = 0; i < selectUserlistBlue.options.length; i++) {
			if (selectUserlistBlue.options[i].value === nick) {
				selectUserlistBlue.remove(i);
				found = true;
				break;
			}
		}
		if(!found) {
			for (var i = 0; i < selectUserlistRed.options.length; i++) {
				if (selectUserlistRed.options[i].value === nick) {
					selectUserlistRed.remove(i);
					found = true;
					break;
				}
			}
		}
		addConsoleMessage("<strong>"+user.nick+" left</strong>", roomName);
	});
	socket.on('quit', function (info) {
		var nick = info.nick;
		var userIndex = userManager.nicks.indexOf(nick);
		var user = userManager.userByNick(nick);

		for (var i = 0; i < userManager.userLookup[userIndex].length; i++) {
			if (userManager.userLookup[userIndex][i] === null) continue;
			var roomName = userManager.roomNames[userManager.userLookup[userIndex][i]];
			addConsoleMessage("<strong>"+user.nick+" left the server</strong>", roomName);
		}

		userManager.removeUser(user);

		// TODO: Improve this code:

		var found = false;
		for (var i = 0; i < selectUserlistBlue.options.length; i++) {
			if (selectUserlistBlue.options[i].value === nick) {
				selectUserlistBlue.remove(i);
				found = true;
				break;
			}
		}
		if(!found) {
			for (var i = 0; i < selectUserlistRed.options.length; i++) {
				if (selectUserlistRed.options[i].value === nick) {
					selectUserlistRed.remove(i);
					found = true;
					break;
				}
			}
		}

	});

	socket.on('chat', function (info) {
		var nick = info.nick;
		var roomName = info.room;
		var message = info.message;
		console.log(roomName, nick, message);
		var myRoomIndex = myRooms.indexOf(roomName);
		if (chatLogs[myRoomIndex]) {
			var chatNode = document.createElement('div');
			chatNode.textContent = nick+": "+message;
			addChatNode(chatNode, roomName);
		}
	});

	socket.on('console', function (info) {
		var roomName = info.room;
		var message = info.message;
		addConsoleMessage("<em>"+message+"</em>", roomName);
	});

	socket.on('upatesettings', function (info) {
		var roomName = info.room;
		var nick = info.nick;
		var settings = info.settings;
		
		var user = userManager.userByNick(nick);

		updateUserOptionSettings(user, roomName, settings);
	});

	socket.on('rename', function (info) {
		var oldNick = info.oldNick;
		var newNick = info.newNick;
	});
	
	socket.on('warning', function (message) {
		console.warn(message);
	});

	socket.on('disconnect', function () {
		console.log('Disconnected');
		myUser = null;
		userManager = null;
		selectRooms.options.length = 0;
		selectUserlistBlue.options.length = 0;
		selectUserlistRed.options.length = 0;
		for (var i = 0; i < myRooms.length; i++) {
			chatLogs[i].parentNode && chatlogsdiv.removeChild(chatLogs[i]);
		}
		myRooms.length = 0;
		chatLogs.length = 0;
		mySettings.length = 0;
		currentRoom = null;
	});

	chatForm.addEventListener('submit', function () {
		
		if (chatInput.value.length > 0 && currentRoom) {

			socket.emit('chat', {
				room: currentRoom,
				message: chatInput.value
			});
			chatInput.value = '';
		}
	}, false);

	selectRooms.addEventListener('change', function () {
		if (selectRooms.selectedIndex === -1) return;
		var newRoom = selectRooms.options[selectRooms.selectedIndex].value;
		if (newRoom !== currentRoom) {
			changeRoom(newRoom);
		}
	}, false);

	leaveRoomBtn.addEventListener('click', function () {
		if (currentRoom) {
			socket.emit('leaveroom', currentRoom);
		}
	});

	joinRoomBtn.addEventListener('click', function () {
		var roomName = prompt("Join a room", "");
		if (roomName && roomName.length > 0) {
			if (myRooms.indexOf(roomName) !== -1) {
				changeRoom(roomName);
			} else {
				socket.emit('joinroom', roomName);
			}
		}
	});

	colorpicker.addEventListener('change', function () {

		socket.emit('upatesettings', {
			room: currentRoom,
			settings: {
				color: colorpicker.options[colorpicker.selectedIndex].value
			}
		});

	}, false);

	toggleReady.addEventListener('change', function () {
		socket.emit('upatesettings', {
			room: currentRoom,
			settings: {
				ready: !mySettings[myRooms.indexOf(currentRoom)].ready
			}
		});
	}, false);

}());