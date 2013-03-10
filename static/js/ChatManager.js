
//define(['ChatItem'], function (ChatItem) {
var ChatManager = (function () {

	function ChatManager() {
		var self = this;

		this.sendChatCallback = null;

		this.chatContainer = document.querySelector('#chatContainer');
		this.log = [];
		this.canChat = false;
		this.chatForm = document.querySelector('#chatForm');
		this.inputChat = this.chatForm.querySelector('#inputChat');
		this.submitChat = this.chatForm.querySelector('#submitChat');
		this.disableElements = [this.inputChat, this.submitChat];

		this.chatForm.addEventListener('submit', function (e) {
			e.preventDefault();
			if (self.canChat && self.inputChat.value.length > 0) {
				self.sendChatCallback(self.inputChat.value);
				self.inputChat.value = '';
			}
		}, false);
	}

	ChatManager.prototype.disable = function () {
		this.disableElements.forEach(function (elem) {
			elem.disabled = true;
		});
		this.canChat = false;
		this.inputChat.blur();
	}
	ChatManager.prototype.enable = function () {
		this.disableElements.forEach(function (elem) {
			elem.disabled = false;
		});
		this.canChat = true;
		this.inputChat.focus();
	}

	ChatManager.prototype.addChat = function (user, message, timestamp) {
		var item = new ChatItem({type: ChatItem.TYPE_CHAT, user: user, message: message, timestamp: timestamp || new Date()});
		this.addItem(item);
	}

	ChatManager.prototype.addConsole = function (message, className, timestamp) {
		var item = new ChatItem({type: ChatItem.TYPE_CONSOLE, message: message, timestamp: timestamp || new Date()});
		if (typeof className === 'string') {
			item.node.classList.add(className);
		}
		this.addItem(item);
	}

	ChatManager.prototype.addItem = function (item) {
		this.log.push(item);
		this.chatContainer.appendChild(item.node);
		this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
	}

	ChatManager.prototype.clear = function () {
		while (this.log.length > 0) {
			if (this.log[0].node.parentNode === this.chatContainer) {
				this.chatContainer.removeChild(this.log[0].node);
			}
		}
	}

	return ChatManager;
}());
//});