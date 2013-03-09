
//define(function () {
var LoginManager = (function () {
	'use strict';

	function LoginManager() {
		var self = this;

		this.loginAttemptCallback = null;

		this.canLogin = true;
		this.loginForm = document.querySelector('#loginForm');
		this.inputNick = this.loginForm.querySelector('#inputNick');
		this.submitLogin = this.loginForm.querySelector('#submitLogin');
		this.errorNode = this.loginForm.querySelector('#loginErrorNode');
		this.disableElements = [this.inputNick, this.submitLogin];

		
		loginForm.addEventListener('submit', function (e) {
			e.preventDefault();
			var nick = self.inputNick.value.trim();
			if (self.canLogin && nick.length > 0) {
				
				self.errorNode.innerHTML = '';

				self.disable();

				self.loginAttemptCallback(nick);
			}
		}, false);

		this.disable(false);
		this.inputNick.focus();
	}

	LoginManager.prototype.disable = function (doDisable) {
		if (typeof doDisable === 'undefined') {
			doDisable = true;
		}
		this.disableElements.forEach(function (elem) {
			elem.disabled = doDisable;
		});
	}

	LoginManager.prototype.failed = function (reason) {
		this.disable(false);
		this.inputNick.focus();
		this.canLogin = true;
		this.errorNode.innerHTML = reason || '';
	}

	LoginManager.prototype.logout = function (clearForm) {
		this.disable(false);
		if (clearForm) {
			this.inputNick.value = "";
		}
		this.inputNick.focus();
		this.canLogin = true;
	}

	
	
	return LoginManager;
}());
//});