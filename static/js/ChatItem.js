
//define(function () {
var ChatItem = (function () {
	
	function zeroFill(v) {
		if (v <= 9) {
			v = "0"+v;
		}
		return v;
	}

	function ChatItem(config) {
		this.type = config.type;
		this.user = config.user || null;
		this.node = document.createElement('div');
		this.timestamp = config.timestamp;

		this.node.classList.add('post');

		this.timestampNode = document.createElement('span');
		this.timestampNode.classList.add('timestamp');
		this.timestampNode.textContent = zeroFill(this.timestamp.getHours())+':'+zeroFill(this.timestamp.getMinutes());

		this.nickNode = document.createElement('span');
		this.nickNode.classList.add('nick');

		this.messageNode = document.createElement('span');
		this.messageNode.classList.add('message');
		this.messageNode.innerHTML = config.message;

		if (this.type === ChatItem.TYPE_CHAT) {
			this.node.appendChild(this.timestampNode);
			this.node.appendChild(this.nickNode);
			this.node.appendChild(this.messageNode);
			this.nickNode.textContent = this.user.nick;
			this.node.classList.add('chat');
		} else if (config.type === ChatItem.TYPE_CONSOLE) {
			this.node.appendChild(this.timestampNode);
			this.node.appendChild(this.messageNode);
			this.node.classList.add('console');
		} else {
			throw "Invalid type "+config.type;
		}
	}
	ChatItem.TYPE_CHAT = 0;
	ChatItem.TYPE_CONSOLE = 1;

	return ChatItem;
}());
//});
