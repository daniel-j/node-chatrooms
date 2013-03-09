
//require(     ['ViewManager', 'LoginManager', 'UserManager', 'ChatManager'], function ( ViewManager,   LoginManager,   UserManager,   ChatManager ) {
(function () {
	'use strict';
	
	var wsHost = 'ws://'+document.location.hostname+':8080/';
	var wsProtocol = 'chat';

	var ws = null;
	var myNick = '';
	var isLoggedIn = false;
	var isOpen = false;
	var connectHidden = false;
	var heartbeatTimer = null;

	var views    = new ViewManager();
	var login    = new LoginManager();
	var userlist = new UserManager();
	var chat     = new ChatManager();

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

	function sendPacket(obj) {
		if (ws && ws.readyState === 1) {
			ws.send(JSON.stringify(obj));
			resetHeartbeatTimer();
			console.log("SENT:", JSON.stringify(obj), obj);
		} else {
			throw "Unable to write on socket "+(ws && ws.readyState);
		}
	}

	function resetHeartbeatTimer() {
		stopHeartbeatTimer();
		heartbeatTimer = setTimeout(sendHeartbeatPacket, 20*1000);
	}
	function stopHeartbeatTimer() {
		clearTimeout(heartbeatTimer);
	}
	function sendHeartbeatPacket() {
		sendPacket({heartbeat: 1});
		resetHeartbeatTimer();
	}

	function wsOpen(e) {
		console.log("CONNECTED");
		isOpen = true;
		sendPacket({nick: myNick});
	}
	function wsMessage(e) {
		var data = JSON.parse(e.data);
		console.log("RECIEVED:", e.data, data);
		
		if (typeof data.nick !== 'undefined') {
			if (typeof data.index === 'undefined') { // Your nick/welcome
				isLoggedIn = true;
				if (!connectHidden) {
					chat.clear();
				}
				hideConnect();
				chat.enable();
				myNick = data.nick;

			} else {
				// Rename
			}
		}
		if (typeof data.userlist !== 'undefined') {
			userlist.clear();
			data.userlist.forEach(function (info) {
				userlist.addUser(info);
			});
			userlist.update();
		}
		if (typeof data.join !== 'undefined') {
			var user = userlist.addUser(data.join);
			chat.addConsole('<strong>'+utils.html2text(user.nick)+'</strong> joined the room');
			userlist.update();
		}
		if (typeof data.leave !== 'undefined') {
			var user = userlist.getByIndex(data.leave);
			chat.addConsole('<strong>'+utils.html2text(user.nick)+'</strong> left the room');
			userlist.removeUser(data.leave);
		}
		if (typeof data.error !== 'undefined') {
			if (isLoggedIn) {
				chat.addConsole(data.error, 'error');
			} else {
				login.failed(data.error);
			}
			
		}
		if (typeof data.chat !== 'undefined') {
			var timestamp = new Date(data.timestamp);
			var user = userlist.getByIndex(data.index);
			chat.addChat(user, utils.html2text(data.chat), timestamp);
		}
	}
	function wsClose(e) {
		console.log("DISCONNECTED");
		ws.removeEventListener('open', 		wsOpen);
		ws.removeEventListener('message', 	wsMessage);
		ws.removeEventListener('close', 	wsClose);
		ws.removeEventListener('error', 	wsError);
		ws = null;
		stopHeartbeatTimer();
		
		if (isLoggedIn) {
			chat.disable();
			chat.addConsole("Disconnected from server ("+e.code+")", 'error');
		} else {
			if (!isOpen) {
				login.failed("Unable to connect to server");
			}
			
		}
	}
	function wsError(e) {
		//alert("WebSocket error");
		//console.log(e);
	}

	login.loginAttemptCallback = function (nick) {
		
		ws = new WebSocket(wsHost, wsProtocol);
		ws.addEventListener('open', 	wsOpen);
		ws.addEventListener('message', 	wsMessage);
		ws.addEventListener('close', 	wsClose);
		ws.addEventListener('error', 	wsError);

		myNick = nick;

		console.log("CONNECTING...");

		isLoggedIn = false;
		isOpen = false;
	}

	chat.sendChatCallback = function (message) {
		sendPacket({
			chat: message
		});
	}
}());
//});