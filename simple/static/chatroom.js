(function (global, undefined) {
	var Q = function (x) {return global.document.querySelector(x);};
	var on = function (elm, evt, fnc) {
		return elm.addEventListener(evt, fnc, false);
	};
	var welcomescreen = Q("#welcomescreen");
	var container = Q("#container");
	var usernameInput = Q("#usernameInput");
	var chatinput = Q("#chatinput");
	var channelBox = Q("#content");
	var userlist = Q("#userlist");
	var isOnline = false;
	var firstConnected = true;
	var ws = null;
	var myUsername = "";
	var welcomestatus = Q("#welcomestatus");
	var host = document.location.host;
	var joinChannelButton = Q("#addChannel");
	var tablist = Q("#tabs");
	var channels = [];
	var lastChannel = -1;
	
	(function () {
		myUsername = localStorage.getItem('chatroom-username') || "";
		usernameInput.value = myUsername;
		usernameInput.select();
	})();
	
	on(usernameInput.form, "submit", function (e) {
		if(usernameInput.value !== "") {
			myUsername = usernameInput.value;
			localStorage.setItem('chatroom-username', myUsername);
			if(ws === null) {
				welcomestatus.textContent = "Connecting...";
				ws = new WebSocket("ws://"+host+"/?username="+encodeURIComponent(myUsername));
				ws.onopen = sockOpen;
				ws.onmessage = sockData;
				ws.onclose = sockClose;
			}
		}
		else {
			usernameInput.setAttribute("placeholder", "Please choose a name");
			usernameInput.blur();
		}
		e.returnValue = false;
		return false;
	});
	on(joinChannelButton, "click", function () {
		var channel = prompt("Join a channel", "") || "";
		if(channel.length > 0)
			joinChannel(channel.toLowerCase());
	});
	on(tabs, "mousedown", function (e) {
		var tab = e.target;
		var id;
		if(tab.parentNode === tabs && tab !== joinChannelButton) {
			id = +tab.id;
			if(e.which === 1) {
				changeChannel(id);
			}
			else if(e.which === 3) {
				leaveChannel(id);
			}
		}
	});
	on(chatinput, "keydown", function (e) {
		var kc = e.keyCode;
		if(kc === 13 && !e.shiftKey) {
			var msg = chatinput.value;
			if(msg !== "" && channels[lastChannel] !== undefined) {
				chatinput.value = "";
				ws.send(JSON.stringify({'chat': msg, 'channel': channels[lastChannel].name}));
			}
			e.preventDefault();
		}
	});
	
	var sockOpen = function (e) {
		if(isOnline === false && firstConnected) {
			welcomestatus.textContent = "Logging in...";
			container.style.visibility = "visible";
			welcomescreen.style.left = "-100%";
			welcomescreen.style.opacity = "0";
			container.style.left = "0%";
			container.style.opacity = "1";
			container.style.top = "0%";
			setTimeout(function () {
				welcomescreen.style.visibility = "hidden";
			}, 400);
			chatinput.focus();
			joinChannel("#djazz.mine.nu");
			firstConnected = false;
		}
		isOnline = true;
	};
	var sockData = function (e) {
		var data = JSON.parse(e.data);
		if(data.userlist !== undefined) {
			var l = channels.length;
			var j, ul;
			for(var i=0; i < l; i+=1) {
				if(channels[i].name === data.channel) {
					channels[i].userlist = data.userlist;
					userlist.length = 0;
					ul = channels[i].userlist.length;
					for(j=0; j < ul; j+=1) {
						userlist.add(new Option(channels[i].userlist[j].name, channels[i].userlist[j].id), null);
					}
					break;
				}
			}
		}
		else if(data.joiner !== undefined) {
			var l = channels.length;
			var j, ul;
			for(var i=0; i < l; i+=1) {
				if(channels[i].name === data.channel) {
					channels[i].userlist.push(data.joiner);
					userlist.add(new Option(data.joiner.name, data.joiner.id), null);
					addToChat(i, data.joiner.name+" joined");
					break;
				}
			}
		}
		else if(data.leaver !== undefined) {
			var l = channels.length;
			var j, ul;
			for(var i=0; i < l; i+=1) {
				if(channels[i].name === data.channel) {
					ul = userlist.options.length;
					for(j=0; j < ul; j+=1) {
						if(data.leaver === +userlist.options[j].value) {
							userlist.remove(userlist.options[j]);
							break;
						}
					}
					ul = channels[i].userlist.length;
					for(j=0; j < ul; j+=1) {
						if(data.leaver === channels[i].userlist[j].id) {
							addToChat(i, channels[i].userlist[j].name+" left");
							channels[i].userlist.splice(j, 1);
						}
					}
					break;
				}
			}
		}
		else if(data.chat !== undefined) {
			var l = channels.length;
			var j, ul;
			for(var i=0; i < l; i+=1) {
				if(channels[i].name === data.channel) {
					ul = channels[i].userlist.length;
					for(j=0; j < ul; j+=1) {
						if(data.who === channels[i].userlist[j].id) {
							addToChat(i, "<b>"+channels[i].userlist[j].name+":</b> "+data.chat.replace(/\n/g, "<br>"));
							break;
						}
					}
					break;
				}
			}
		}
	};
	var sockClose = function (e) {
		if(isOnline === false && firstConnected) {
			welcomestatus.textContent = "Unable to connect";
			ws.close();
			ws.onopen = null;
			ws.onmessage = null;
			ws.onclose = null;
			ws = null;
			return;
		}
		isOnline = false;
		ws.close();
		ws.onopen = null;
		ws.onmessage = null;
		ws.onclose = null;
		ws = null;
		/*ws = new WebSocket("ws://"+hostname+":"+port+"/?username="+encodeURIComponent(myUsername));
		ws.onopen = sockOpen;
		ws.onmessage = sockData;
		ws.onclose = sockClose;*/
		welcomestatus.textContent = "Disconnected";
		welcomescreen.style.left = "0%";
		welcomescreen.style.opacity = "1";
		container.style.left = "100%";
		container.style.opacity = "0";
		container.style.top = "-100%";
		welcomescreen.style.visibility = "visible";
		setTimeout(function () {
			container.style.visibility = "hidden";
			firstConnected = true;
			lastChannel = -1;
		}, 400);
		usernameInput.select();
		for(var i=0; i < channels.length; i+=1) {
			tabs.removeChild(channels[i].tab);
			channelBox.removeChild(channels[i].chat);
		}
		channels = [];
	};
	var changeChannel = function (id) {
		if(channels[lastChannel] !== undefined) {
			channels[lastChannel].tab.className = "";
			channels[lastChannel].chat.style.display = "none";
		}
		if(channels[id] !== undefined) {
			channels[id].tab.className = "selected";
			channels[id].chat.style.display = "block";
			channelBox.scrollTop = channelBox.scrollHeight;
		}
		userlist.length = 0;
		lastChannel = id;
		if(channels[id] !== undefined) {
			var l = channels[id].userlist.length;
			for(var i=0; i < l; i+=1) {
				userlist.add(new Option(channels[id].userlist[i].name, channels[id].userlist[i].id), null);
			}
		}
	};
	var joinChannel = function (channel) {
		var l = channels.length;
		for(var i=0; i < l; i+=1) {
			if(channels[i].name === channel) {
				changeChannel(i);
				return;
			}
		}
		ws.send(JSON.stringify({'join': channel}));
		var tab = global.document.createElement("LI");
		tab.textContent = channel;
		tab.id = channels.length;
		tablist.insertBefore(tab, joinChannelButton);
		var chat = global.document.createElement("DIV");
		chat.className = "channel";
		chat.innerHTML = "Welcome to "+channel;
		channelBox.appendChild(chat);
		channels.push({'name': channel, 'tab': tab, 'chat': chat, 'userlist': []});
		changeChannel(+tab.id);
	};
	var leaveChannel = function (id) {
		var l = channels.length;
		var channel;
		for(var i=0; i < l; i+=1) {
			if(+channels[i].tab.id === id) {
				channel = channels[i];
				ws.send(JSON.stringify({'leave': channel.name}));
				channelBox.removeChild(channel.chat);
				tabs.removeChild(channel.tab);
				channels.splice(i, 1);
				if(lastChannel >= i) lastChannel -= 1;
				changeChannel(lastChannel);
				break;
			}
		}
	};
	var addToChat = function (id, msg) {
		var chat = channels[id].chat;
		var node = document.createElement("DIV");
		node.innerHTML = msg;
		chat.appendChild(node);
		channelBox.scrollTop = channelBox.scrollHeight;
	};
	
})(this);
