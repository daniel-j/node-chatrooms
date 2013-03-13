function UserManager(clientUser) {
	'use strict';

	// here we store more global info about users. it share same indexing as nicks
	var users = [];
	var nicks = []; // this is a fast look up usernames
	// userLookup[userIndex] = array of room indicies
	var userLookup = [];

	// roomNames[roomIndex] = array of room names
	var roomNames = [];
	var roomSettings = [];
	// roomLookup[roomIndex] = array of user indicies
	var roomLookup = []; // we need this, to do easy lookup. to see what index the user has in the room
	// localUserSettings[roomIndex][roomUserIndex] = UserSettings object
	var localUserSettings = []; // but it's also roomLookup

	if (clientUser) {
		addUser(clientUser);
	}

	// like String.trim() but on arrays, only null values. Only trim on end
	function trimArrayEnd() {
		for (var i = 0; i  < arguments.length; i++) {
			var arr = arguments[i];
			if (!Array.isArray(arr)) continue;
			while (arr[arr.length-1] === null && arr.length > 0) {
				arr.pop();
			}
		}
	}

	function addUser(user) {
		console.log("Adding user "+user.nick);
		if (users.indexOf(user) !== -1 || nicks.indexOf(user.nick) !== -1) throw "User "+user.nick+" already exists"; // User already exists
		var nullPos = users.indexOf(null); // read more about this below
		var userIndex = nullPos === -1? users.length : nullPos;
		
		users[userIndex] = user;
		nicks[userIndex] = user.nick;
		userLookup[userIndex] = [];
		return true;
	}

	function removeUser(user) {
		// From all rooms. No its better to do another function
		console.log("Removing user "+user.nick);
		var userIndex = users.indexOf(user); // user is an instance of User
		if (userIndex === -1) throw "No such user "+user.nick; // No such user

		if (user === clientUser) {
			throw "Client user can't be removed";
		}

		var userRooms = userLookup[userIndex];

		for (var r = 0; r < userRooms.length; r++) {
			var roomIndex = userRooms[r];
			var roomName = roomNames[roomIndex];
			var roomUserIndex = roomLookup[roomIndex].indexOf(userIndex);
			//leaveRoom(user, roomNames[roomIndex]);
			
			roomLookup[roomIndex].splice(roomUserIndex, 1);
			localUserSettings[roomIndex].splice(roomUserIndex, 1);

			console.log("Removing "+user.nick+" from "+roomName);

			// Room is empty, remove it
			if (roomLookup[roomIndex].length === 0) {
				console.log("Room "+roomName+" is empty, removing it");
				if (roomIndex === roomNames.length - 1) {
					roomNames.pop();
					roomLookup.pop();
					localUserSettings.pop();
					roomSettings.pop();
				} else {
					roomNames[roomIndex] = null;
					roomLookup[roomIndex] = null;
					localUserSettings[roomIndex] = null;
					roomSettings[roomIndex] = null;
				}
			}
		}

		if (userIndex === users.length - 1) {
			nicks.pop();
			users.pop();
			userLookup.pop();
		} else {
			nicks[userIndex] = null;
			users[userIndex] = null;
			userLookup[userIndex] = null;
		}
		trimArrayEnd(nicks, users, userLookup, roomNames, roomLookup, localUserSettings, roomSettings);

		return true;
	}

	function joinRoom(user, roomName, settings) {
		console.log(user.nick+" is joining room "+roomName);

		var roomIndex = roomNames.indexOf(roomName);

		if (clientUser && user !== clientUser && users.indexOf(user) === -1) {
			var clientRooms = userLookup[0];
			if (clientRooms.indexOf(roomIndex) !== -1) {
				addUser(user);
			} else {
				throw "User "+user.nick+" can't join a room that the client user "+clientUser.nick+" is not in";
			}
		}

		var userIndex = users.indexOf(user);
		if (userIndex === -1) throw "No such user "+user.nick;
		
		if (roomIndex === -1) {
			var nullPos = roomNames.indexOf(null);
			roomIndex = nullPos === -1? roomNames.length : nullPos; // if it didnt find a hole, return the length of the array.
			// nullPos is the position of the first null in the array, a hole. If there are no holes, return the length of the array.

			roomNames[roomIndex] = roomName;
			roomLookup[roomIndex] = [];
			localUserSettings[roomIndex] = [];
			roomSettings[roomIndex] = {};

		} else if (roomLookup[roomIndex].indexOf(userIndex) !== -1) {
			// User is already in room
			throw "User "+user.nick+" already is in room "+roomName;
		}

		//var nullPos = roomLookup[roomIndex].indexOf(null);
		//var roomUserIndex = nullPos === -1? roomLookup[roomIndex].length : nullPos;

		userLookup[userIndex].push(roomIndex);
		roomLookup[roomIndex].push(userIndex);
		localUserSettings[roomIndex].push(settings);
		return true;
	}

	function leaveRoom(user, roomName) {
		console.log(user.nick+" is leaving room "+roomName);
		var userIndex = users.indexOf(user);
		if (userIndex === -1) throw "No such user "+user.nick; // No such user
		var roomIndex = roomNames.indexOf(roomName);
		if (roomIndex === -1) throw "No such room "+roomName; // No such room
		var roomUserIndex = roomLookup[roomIndex].indexOf(userIndex);
		if (roomUserIndex === -1) throw "User "+user.nick+" is not in room "+roomName; // User is not in room
		
		userLookup[userIndex].splice(userLookup[userIndex].indexOf(roomIndex), 1);
		roomLookup[roomIndex].splice(roomUserIndex, 1);
		localUserSettings[roomIndex].splice(roomUserIndex, 1);

		
		// Room is empty, remove it. Also remove if client leaves room
		if (roomLookup[roomIndex].length === 0 || user === clientUser) {

			if (user === clientUser) {
				for (var i = 0; roomLookup[roomIndex] && i < roomLookup[roomIndex].length; i++) {
					var uid = roomLookup[roomIndex][i];
					
					// Remove user if not in any other room
					var userRooms = userLookup[uid];
					if (userRooms.length === 1) {
						var roomUserIndex = roomLookup[roomIndex].indexOf(uid);

						console.log("Removing user "+users[uid].nick);

						if (uid === users.length - 1) {
							nicks.pop();
							users.pop();
							userLookup.pop();
						} else {
							nicks[uid] = null;
							users[uid] = null;
							userLookup[uid] = null;
						}
					}
				}
				trimArrayEnd(users, nicks, userLookup);
			}

			console.log("Room "+roomName+" is empty, removing it");
			if (roomIndex === roomNames.length - 1) {
				roomNames.pop();
				roomLookup.pop();
				localUserSettings.pop();
				roomSettings.pop();
			} else {
				roomNames[roomIndex] = null;
				roomLookup[roomIndex] = null;
				localUserSettings[roomIndex] = null;
				roomSettings[roomIndex] = null;
			}
		}

		trimArrayEnd(roomNames, roomLookup, localUserSettings, roomSettings);
		return true;
	}

	function isUserInRoom(user, roomName) {
		var userIndex = users.indexOf(user);
		if (userIndex === -1) throw "No such user "+user.nick; // No such user
		var roomIndex = roomNames.indexOf(roomName);
		if (roomIndex === -1) throw "No such room "+roomName; // No such room
		var roomUserIndex = roomLookup[roomIndex].indexOf(userIndex);
		return roomUserIndex !== -1;
	}

	function updateLocalUserSettings(user, roomName, settings) {
		console.log(user.nick+" is updating settings in room "+roomName);
		var userIndex = users.indexOf(user);
		if (userIndex === -1) throw "No such user "+user.nick; // No such user
		var roomIndex = roomNames.indexOf(roomName);
		if (roomIndex === -1) throw "No such room "+roomName; // No such room
		var roomUserIndex = roomLookup[roomIndex].indexOf(userIndex);
		if (roomUserIndex === -1) throw "User "+user.nick+" is not in room "+roomName; // User is not in room

		console.log(localUserSettings[roomIndex][roomUserIndex], settings);

		localUserSettings[roomIndex][roomUserIndex].update(settings);

		return true;
	}

	function rename(nick) {
		console.log("Renaming "+user.nick+" to "+nick);
		var userIndex = users.indexOf(user);
		if (userIndex === -1) throw "No such user "+user.nick; // No such user

		user.nick = nick;
		nicks[userIndex] = nick;
		return true;
	}

	function userByNick(nick) {
		return users[nicks.indexOf(nick)] || null;
	}

	function getRoomSettings(roomName) {
		return roomSettings[roomNames.indexOf(roomName)];
	}

	this.users = users;
	this.nicks = nicks;
	this.userLookup = userLookup;
	this.roomNames = roomNames;
	this.roomLookup = roomLookup;
	this.localUserSettings = localUserSettings;
	this.roomSettings = roomSettings;

	this.addUser = addUser;
	this.removeUser = removeUser;
	this.joinRoom = joinRoom;
	this.leaveRoom = leaveRoom;
	this.isUserInRoom = isUserInRoom;
	this.updateLocalUserSettings = updateLocalUserSettings;
	this.rename = rename;
	this.userByNick = userByNick;
	this.getRoomSettings = getRoomSettings;
}

if (typeof module !== 'undefined') {
	module.exports = new UserManager;
}