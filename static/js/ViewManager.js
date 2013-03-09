
//define(['View'], function (View) {
var ViewManager = (function () {
	'use strict';

	function ViewManager() {
		this.views = {};

		var viewElements = document.querySelectorAll('.view');
		
		for (var i = 0; i < viewElements.length; i++) {
			var view = new View(viewElements[i]);
			this.views[view.name] = view;
		}
	}

	ViewManager.prototype.addStateFor = function (name) {
		View.prototype.addState.apply(this.views[name], Array.prototype.slice.call(arguments, 1));
	}
	ViewManager.prototype.removeStateFor = function (name) {
		View.prototype.removeState.apply(this.views[name], Array.prototype.slice.call(arguments, 1));
	}
	
	return ViewManager;

}());
//});