var page = require('webpage').create(), system = require('system'), username, password;
var isFirstTimeEnterRunning = true;
var isTurningOn = false;
var isReloadPage = false;

if (system.args.length < 2) {
	console.log('Usage: koding.js <username> <password>');
	phantom.exit();
} else {
	username = system.args[1];
	password = system.args[2];
}

page.viewportSize = { width: 800, height: 600 };

//method functions
function checkVMStatus() {
	setTimeout(function() {
		var isDialogDisplayed = page.evaluateJavaScript(function() {
			return document.getElementsByClassName('kdmodal-shadow').length > 0;
		});
		var isLoadingStatus = page.evaluateJavaScript(function() {
			if (document.getElementsByClassName('content-container').length > 0) {
				return document.getElementsByClassName('content-container')[0].firstElementChild.textContent.indexOf('turned off') < 0;
			} else {
				return false;
			}
		});
		var vmStatus = 'checking';
		if (isDialogDisplayed) {
			if (!isLoadingStatus) {
				vmStatus = 'off';
			}
		} else {
			vmStatus = 'on';
		}
		if (vmStatus === 'off') {
			isTurningOn = true;
			console.log('[INFO] Turn it on now!!!');
			page.evaluateJavaScript(function() {
				document.getElementsByClassName('content-container')[0].children[1].click();
			});
		} else if (vmStatus === 'on') {
			isTurningOn = false;
			if (isFirstTimeEnterRunning) {
				isFirstTimeEnterRunning = false;
				console.log('[INFO] Running!!!');
				console.log('[INFO] Terminate old sessions and create a new session...');
				// close all sessions, and create a new session
				page.evaluateJavaScript(function() {
					setTimeout(function() {
						document.getElementsByClassName('plus')[0].click();
						setTimeout(function() {
							var sessionMenu = document.getElementsByClassName('new-terminal')[0].nextElementSibling;
							sessionMenu.className = sessionMenu.className.replace('hidden', '');
							if (document.getElementsByClassName('terminate-all').length > 0) {
								document.getElementsByClassName('terminate-all')[0].click();
								setTimeout(function() {
									document.getElementsByClassName('plus')[0].click();
									setTimeout(function() {
										var newSessionMenu = document.getElementsByClassName('new-terminal')[0].nextElementSibling;
										newSessionMenu.className = newSessionMenu.className.replace('hidden', '');
										setTimeout(function() {
											document.getElementsByClassName('new-session')[0].click();
										}, 1000);
									}, 1000);
								}, 5000);
							} else {
								document.getElementsByClassName('new-session')[0].click();
							}
						}, 1000);
					}, 5000);
				});
				setTimeout(function() {
					console.log('[INFO] ' + new Date());
					console.log('\r\n');
					phantom.exit();
				}, 15000);
			} else {
				console.log('[WARN] Check running again.');
			}
		} else {
			checkVMStatus();
		}
	}, 500);
};

// page functions
page.onLoadStarted = function() {
	if (isReloadPage) {
		isReloadPage = false;
	} else {
		var currentUrl = page.evaluate(function() {
			return window.location.href;
		});
		console.log('[INFO] Current page ' + currentUrl + ' will gone...');
		console.log('[INFO] Now loading a new page...');
	}
};

page.onLoadFinished = function(status) {
	if (status !== 'success') {
		isReloadPage = true;
		page.reload();
	} else {
		var currentUrl = page.evaluate(function() {
			return window.location.href;
		});
		console.log('[INFO] Page ' + currentUrl + ' loaded...');
		if (currentUrl == 'https://koding.com/Login') {
			console.log('[INFO] Login now!!!');
			page.evaluate(function(username, password) {
				document.querySelector('input[testpath="login-form-username"]').value = username;
				document.querySelector('input[testpath="login-form-password"]').value = password;
				document.querySelector('button[testpath="login-button"]').click();
			}, username, password);
		} else if (currentUrl == 'https://koding.com/IDE/koding-vm-0/my-workspace') {
			checkVMStatus();
		}
	}
};

// start program
console.log('[INFO] ' + new Date());
page.open('https://koding.com/Login', function(status) {
	if (status !== 'success') {
		isReloadPage = true;
		page.reload();
	}
});

// force kill this phantomJS thread if it's still alive after 3 mins
// wait for 1 more min if it's turning on
setTimeout(function() {
	if (isTurningOn) {
		setTimeout(function() {
			console.log('[WARN] Force killed!!!');
			console.log('[INFO] ' + new Date());
			console.log('\r\n');
			phantom.exit();
		}, 60000);
	} else {
		console.log('[WARN] Force killed!!!');
		console.log('[INFO] ' + new Date());
		console.log('\r\n');
		phantom.exit();
	}
}, 180000);
