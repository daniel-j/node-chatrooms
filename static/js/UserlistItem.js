
//define(['User'], function (User) {
var UserlistItem = (function () {
	'use strict';

	// UserlistItem inherits from User.. da magicks!
	function UserlistItem(config) {
		this.super = Object.getPrototypeOf(Object.getPrototypeOf(this)); // or User.prototype

		this.node = document.createElement('div');
		this.node.classList.add('userlistitem');
		this.nickNode = document.createElement('span');
		this.nickNode.classList.add('nick');
		this.node.appendChild(this.nickNode);

		if (config) {
			this.update(config);
		}
	}

	UserlistItem.prototype = Object.create(User.prototype);
	UserlistItem.prototype.constructor = UserlistItem;

	UserlistItem.prototype.update = function (config) {
		this.super.update.apply(this, arguments); // Run the super-update function
		
		if ('nick' in config) {
			this.nickNode.textContent = this.nick;
		}
		
	}

	return UserlistItem;
}());
//});
