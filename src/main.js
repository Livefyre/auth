var inherits = require('inherits');
var EventEmitter = require('event-emitter');
var log = require('debug')('auth');

function Auth (opts) {
    EventEmitter.apply(this, arguments);
    opts = opts || {};
    this.user = opts.user || require('auth/user');
    this.delegate(opts);
}
inherits(Auth, EventEmitter);

/**
 * Delegate auth actions to the provided object
 * @param delegatee {object} The object to delegate actions to.
 *     It should implement .login, .logout functions.
 */
Auth.prototype.delegate = function (opts) {
    var lastDelegatee = this._delegatee || {
        login: log.bind(log, 'default login'),
        logout: log.bind(log, 'default logout')
    };
    this._delegatee = {
        login: opts.login || lastDelegatee.login,
        logout: opts.logout || lastDelegatee.logout
    };
    return this;
};

/**
 * Try to facilitate authentication (login) by the end user
 */
Auth.prototype.login = function () {
    this._delegatee.login.apply(this._delegatee, arguments);
};

/**
 * Try to facilitate deauthentication (logout) by the user
 */
Auth.prototype.logout = function () {
    this._delegatee.logout.apply(this._delegatee, arguments);
};

module.exports = createAuth();

/**
 * Create an Auth object
 * @param [opts] {object} Options to configure the Auth object
 */
function createAuth(opts) {
    return new Auth(opts);
}
