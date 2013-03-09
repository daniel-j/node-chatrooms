
//define(function () {
var User = (function () {
	'use strict';

	var isServer = typeof process !== 'undefined';

	function User(config) {

		this.nick = '';

		if (isServer) { // server only
			this.ready = false;
			this.socket = null;
		}

		if (config) {
			this.update(config);
		}
	}

	User.prototype.update = function (config) {

		if ('nick' in config) this.nick = config.nick;

		if (isServer) {
			if ('ready'  in config) this.ready  = config.ready;
			if ('socket' in config) this.socket = config.socket;
		}
	}

	// toJSON gets called from JSON.stringify().
	// This is the public stuff that gets sent to clients
	User.prototype.toJSON = function () {
		return {
			nick: this.nick
		};
	}

	return User;
}());

// To make it work as a node.js module aswell
if (typeof module !== 'undefined') {
	module.exports = User;
}

//});

