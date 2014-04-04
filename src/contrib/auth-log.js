// Create an auth log in the specified el
module.exports = function createAuthLog(auth, el) {
    var session = auth.get();
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
    if (session) {
        authLog('Sessions restored for: '+Object.keys(session));
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