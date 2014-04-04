// Create an auth button in the specified el
var nextId = 0;

module.exports = function (auth, el, log) {
    var id = nextId++;
    log = log || getDefaultLog();
    function isLoggedIn () {
        return auth.get();
    }
    function getText () {
        return isLoggedIn() ? 'Log out' : 'Log in';
    }
    function setText () {
        el.innerText = getText();
    }
    function toggle () {
        if (isLoggedIn()) {
            auth.logout(function (logoutStatus) {
                log('Logged out via authButton '+id);
            });
        } else {
            auth.login(function (loginStatus) {
                if (loginStatus instanceof Error) {
                    return;
                }
                log('Logged in via authButton '+id);
            });
        }
        setText();
    }
    auth.on('login', setText);
    auth.on('logout', setText);
    el.addEventListener('click', toggle);
    setText();
};

function getDefaultLog() {
    var console = (typeof console === 'undefined') ? {} : console;
    if (typeof console.log === 'function') {
        return console.log;
    }
    return function () {};
}