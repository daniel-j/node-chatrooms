
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
		this.userlist = document.querySelector('#userlist');
	}

	UserManager.prototype.addUser = function (info) {
		var user = new UserlistItem(info);
		
		this.users.push(user);
		this.sortedUsers.push(user); // Will sort later
		this.nodeQueue.push(user);
		return user;
	}
	UserManager.prototype.removeUser = function (index) {
		var user = this.users[index];
		this.userlist.removeChild(user.node);

		this.users.splice(index, 1);
		this.sortedUsers.splice(this.sortedUsers.indexOf(user), 1);
		this.nodeQueue.splice(this.nodeQueue.indexOf(user.node), 1);
	}
	UserManager.prototype.updateUser = function (index, info) {
		users[index].update(info);
	}
	UserManager.prototype.update = function () {
		var self = this;
		this.sortedUsers.sort(userlistSort);
		
		this.nodeQueue.forEach(function (user) {
			var index = self.users.indexOf(user);
			var sortIndex = self.sortedUsers.indexOf(user);

			if (self.sortedUsers[sortIndex+1] && self.sortedUsers[sortIndex+1].node.parentNode) { // Insert before
				var nextUser = self.sortedUsers[sortIndex+1];
				
				self.userlist.insertBefore(user.node, nextUser.node);

			} else { // Append
				self.userlist.appendChild(user.node);
			}

		});
		this.nodeQueue = [];
	}
	UserManager.prototype.clear = function () {
		while (this.users.length > 0) {
			this.removeUser(0);
		}
	}
	UserManager.prototype.getByIndex = function (index) {
		return this.users[index];
	}

	return UserManager;
}());
//});