var auth = require('auth');
var log = require('debug')('auth-demo');

auth.delegate({
    login: function () {
        log('login', arguments);
        auth.user.set({ id: '1' });
    },
    logout: function () {
        log('logout', arguments);
        auth.user.set({ id: null });
    }
});

if (document.readyState === 'complete') {
    onDomReady();
} else {
    debugger;
    document.addEventListener("DOMContentLoaded", onDomReady);
}

function onDomReady() {
    log('onDomReady');
    authButton(document.getElementById('auth-button'));
    authLog(document.getElementById('auth-log'));
}

function authButton (el) {
    function isLoggedIn () {
        return auth.user.isAuthenticated();
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
            logOut();
        } else {
            logIn();
        }
        setText();
    }
    function logIn() {
        auth.login();
    }
    function logOut() {
        auth.logout();
    }
    log('init authButton');
    el.addEventListener('click', function onClick (e) {
        toggle();
    });
}

function authLog(el) {
    function log (message) {
        var logEl = document.createElement('p');
        logEl.innerText = message;
        el.appendChild(logEl);
    }
    var onLogin = log.bind(this, 'Logged in');
    var onLogout = log.bind(this, 'Logged out');
    auth.on('login', onLogin);
    auth.on('logout', onLogout);
}
