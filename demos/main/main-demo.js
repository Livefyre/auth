var auth = window.auth = require('auth');
var log = require('debug')('auth-demo');
var createAuthButton = require('auth/contrib/auth-button');
var createAuthLog = require('auth/contrib/auth-log');

function passwordLogin(password) {
    var passwordAuthDelegate = {
        login: function () {
            var passwordGuess = window.prompt("What is the password?");
            if (passwordGuess !== password) {
                return new Error('Wrong password');
            }
            return passwordGuess;
        }
    };
    return passwordAuthDelegate;
}

// Delegate to my custom, sync auth implementation
auth.delegate({
    login: function (finishLogin) {
        log('login', arguments);
        var userId = Math.round(Math.random() * 10e9);
        finishLogin(null, 'myToken'+userId);
        // or if the user was not authenticated
        // finishLogin();
        // or if there was an error;
        // finishLogin(new Error('Please enable cookies to log in'));
    }
});

auth.delegate(passwordLogin('password'));

// The user is currently logged in on page load
auth.authenticate('creds');

// Render on DOMReady
if (document.readyState === 'complete') {
    onDomReady();
} else {
    document.addEventListener("DOMContentLoaded", onDomReady);
}

function onDomReady() {
    log('onDomReady');
    var authLog = createAuthLog(auth, document.getElementById('auth-log'));
    createAuthButton(auth, document.getElementById('auth-button1'), authLog);
    createAuthButton(auth, document.getElementById('auth-button2'), authLog);
    authLog('ready');
}
