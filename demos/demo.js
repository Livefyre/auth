var auth = require('auth');
var log = require('debug')('auth-demo');

auth.delegate({
    login: function () {
        log('login', arguments);
    },
    logout: function () {
        log('logout', arguments);
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
    var loggedIn = false;
    function getText () {
        return loggedIn ? 'Log out' : 'Log in';
    }
    function setText () {
        el.innerText = getText();
    }
    function toggle () {
        log('toggle', loggedIn);
        if (loggedIn) {
            logOut();
        } else {
            logIn();
        }
    }
    function logIn() {
        auth.login();
        loggedIn = true;
    }
    function logOut() {
        auth.logout();
        loggedIn = false;
    }
    log('init authButton');
    el.addEventListener('click', function onClick (e) {
        toggle();
    });
}

function authLog(el) {

}
