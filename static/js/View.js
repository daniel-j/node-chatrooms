
//define(function () {
var View = (function () {
	'use strict';

	var availableStates = ['left', 'right', 'top', 'bottom', 'behind'];

	function View(viewElement) {
		this.element = viewElement;
		this.name = this.element.dataset.name;
		this.states = [];
		this.element.classList.add('active');
		
		if (this.element.dataset.states) {
			this.addState.apply(this, this.element.dataset.states.split(','));
		}
	}
	
	/*View.prototype.setState = function (states) {
		states = typeof states === 'object' && states.length > 0? states : arguments;
	}*/

	View.prototype.addState = function () {
		for (var i = 0; i < arguments.length; i++) {
			var state = arguments[i].toLowerCase();
			if (this.states.indexOf(state) === -1) {
				if (availableStates.indexOf(state) !== -1) {
					this.states.push(state);
					this.element.classList.add(state);
				} else {
					throw "Invalid state "+state;
				}
			}
		}
	}

	View.prototype.removeState = function () {
		for (var i = 0; i < arguments.length; i++) {
			var state = arguments[i].toLowerCase();
			var pos = this.states.indexOf(state);
			if (pos !== -1) {
				if (availableStates.indexOf(state) !== -1) {
					this.states.splice(pos, 1);
					this.element.classList.remove(state);
				} else {
					throw "Invalid state "+state;
				}
			}
		}
	}
	
	return View;
}());
//});