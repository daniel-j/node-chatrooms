
//define(['UserlistItem'], function (UserlistItem) {
var UserManager = (function () {
	'use strict';

	// Sort alphabetically by nick
	function userlistSort(u1, u2) {
		var a = u1.nick.toLowerCase();
		var b = u2.nick.toLowerCase();
		if (a < b) return -1;
		else if (a > b) return 1;
		else {
			a = u1.nick;
			b = u2.nick;
			if (a < b) return -1;
			else if (a > b) return 1;
			else return 0;
		}
	}

	function UserManager() {
		this.users = [];
		this.sortedUsers = [];
		this.nodeQueue = [];
		this.nicks = []; // simple look-up array
		this.userlist = document.createElement('div');
	}

	UserManager.prototype.addUser = function (info) {
		if (this.nicks.indexOf(info.nick) !== -1) {
			console.log("Ignoring add of "+info.nick+": already exists");
			return this.users[this.nicks.indexOf(info.nick)];
		}
		var user = new UserlistItem(info); // Creates a new user
		console.log("UserManager:", "Adding user "+user.nick);
		this.users.push(user);
		this.sortedUsers.push(user); // Will sort later
		this.nodeQueue.push(user);
		this.nicks.push(user.nick);
		return user;
	}
	UserManager.prototype.removeUser = function (user) {
		console.log("UserManager:", "Removing user "+user.nick);
		this.userlist.removeChild(user.node);
		var index = this.users.indexOf(user);
		this.users.splice(index, 1);
		this.sortedUsers.splice(this.sortedUsers.indexOf(user), 1);
		this.nodeQueue.splice(this.nodeQueue.indexOf(user.node), 1);
		this.nicks.splice(index, 1);
	}
	/*UserManager.prototype.updateUser = function (user, info) {
		users[index].update(info);
	}*/
	UserManager.prototype.update = function () {
		console.log("UPDATING/SORTING USERLIST", this, this.nicks, this.nodeQueue);
		var self = this;
		this.sortedUsers.sort(userlistSort);
		
		this.nodeQueue.forEach(function (user) {
			var index = self.users.indexOf(user);
			var sortIndex = self.sortedUsers.indexOf(user);

			if (self.sortedUsers[sortIndex+1] && self.sortedUsers[sortIndex+1].node.parentNode) { // Insert before
				var nextUser = self.sortedUsers[sortIndex+1];
				
				self.userlist.insertBefore(user.node, nextUser.node);
				console.log("Inserting "+user.nick+" before "+nextUser.nick);

			} else { // Append
				self.userlist.appendChild(user.node);
				console.log("Appending "+user.nick);
			}

		});
		this.nodeQueue = [];
	}
	UserManager.prototype.clear = function () {

		while (this.users.length > 0) {

			this.removeUser(this.users[0]);
		}
	}
	/*UserManager.prototype.getByIndex = function (index) {
		return this.users[index];
	}*/
	UserManager.prototype.getByNick = function (nick) {
		return this.users[this.nicks.indexOf(nick)];
		/*for (var i = 0; i < this.users.length; i++) {
			if (this.users[i].nick === nick) {
				return this.users[i];
			}
		}
		return null;*/
	}

	return UserManager;
}());
//});