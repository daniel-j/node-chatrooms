
var utils = (function () {
	'use strcit';
	var tmpDiv = document.createElement('div');

	var utils = {
		html2text: function (html) {
			tmpDiv.textContent = html;
			var text = tmpDiv.innerHTML;
			tmpDiv.textContent = '';
			return text;
		}
	};

	return utils;
}());