var auth = require('auth');
var log = require('debug')('auth-demo');

auth.delegate({
    login: function (finishLogin) {
        log('login', arguments);
        auth.user.set({ id: '1' });
        finishLogin();
    },
    logout: function (finishLogout) {
        log('logout', arguments);
        auth.user.set({ id: null });
        finishLogout();
    }
});

if (document.readyState === 'complete') {
    onDomReady();
} else {
    document.addEventListener("DOMContentLoaded", onDomReady);
}

var authLog;
function onDomReady() {
    log('onDomReady');
    createAuthButton(document.getElementById('auth-button'));
    authLog = createAuthLog(document.getElementById('auth-log'));
    authLog('dom ready');
}

function createAuthButton (el) {
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
    log('init createAuthButton');
    el.addEventListener('click', function onClick (e) {
        toggle();
    });
}

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
    var onLogin = authLog.bind(this, 'Logged in');
    var onLogout = authLog.bind(this, 'Logged out');
    auth.on('login', onLogin);
    auth.on('logout', onLogout);
    return authLog;
}
