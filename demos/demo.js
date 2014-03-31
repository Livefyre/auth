var auth = require('auth');
var log = require('debug')('auth-demo');

function passwordLogin(password) {
    var passwordAuthDelegate = {
        login: function (finishLogin) {
            var passwordGuess = window.prompt("What is the password?");
            if (passwordGuess !== password) {
                finishLogin(new Error('Wrong password'));
                return;
            }
            finishLogin(passwordGuess);
        }
    };
    return passwordAuthDelegate;
}

// Delegate to my custom auth implementation
auth.delegate({
    login: function (finishLogin) {
        log('login', arguments);
        var userId = Math.round(Math.random() * 10e9);
        finishLogin('myToken'+userId);
        // or if the user was not authenticated
        // finishLogin();
        // or if there was an error;
        // finishLogin(new Error('Please enable cookies to log in'));
    }
});

auth.delegate(passwordLogin('password'));

// Render on DOMReady
if (document.readyState === 'complete') {
    onDomReady();
} else {
    document.addEventListener("DOMContentLoaded", onDomReady);
}

var authLog;
function onDomReady() {
    log('onDomReady');
    createAuthButton(document.getElementById('auth-button1'));
    createAuthButton(document.getElementById('auth-button2'));
    authLog = createAuthLog(document.getElementById('auth-log'));
    authLog('dom ready');
}

// Create an auth button in the specified el
function createAuthButton (el) {
    function isLoggedIn () {
        return auth.isAuthenticated();
    }
    function getText () {
        return isLoggedIn() ? 'Log out' : 'Log in';
    }
    function setText () {
        el.innerText = getText();
    }
    function toggle () {
        log('toggle', isLoggedIn());
        if (isLoggedIn()) {
            auth.logout();
        } else {
            auth.login();
        }
        setText();
    }
    auth.on('login', setText);
    auth.on('logout', setText);
    el.addEventListener('click', toggle);
    log('init createAuthButton');
}

// Create an auth log in the specified el
function createAuthLog(el) {
    function authLog (message) {
        var logEl = document.createElement('p');
        logEl.innerText = message;
        prependEl(el, logEl);
    }
    function prependEl(parent, child) {
        if (parent.firstChild) {
            parent.insertBefore(child, parent.firstChild);
        } else {
            parent.appendChild(child);
        }
    }
    var onLogin = function (creds) {
        authLog('Logged in with ' + creds);
    };
    var onLogout = authLog.bind(this, 'Logged out');
    auth.on('login', onLogin);
    auth.on('logout', onLogout);
    auth.on('error', function (err) {
        authLog('Error: '+err.message);
    });
    return authLog;
}
