'use strict';

window.onload = function () {
	chrome.runtime.getBackgroundPage(function (backgroundPage) {
	  // close popup window
		backgroundPage.startRecord();
		window.close();
	});
};
