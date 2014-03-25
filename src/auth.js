/**

Web Components frequently need to know about and/or trigger authentication by
the end-user, but should not need to be tightly-coupled to any one authentication
strategy.

Web Site operators make the decisions about what sort of authentication strategies
they prefer. They should be able to delegate the details to an Auth object to
coordinate the effort.

This module exports a function that will create an Auth object. Usually there
will only be one Auth object running on a webpage.

On load, a customer should
use the `.delegate` method to configure this Auth object by passing an
'authentication delegate' like the following:

    auth.delegate({
        // Called when a component would like to authenticate the end-user
        // You may want to redirect to a login page, or open a popup
        // Call `finishLogin` when login is complete, passing an Error object
        // if there was an error
        login: function (finishLogin) {
            finishLogin();
        },

        // Called when a component would like to deauthenticate the end-user
        // You may want to clear a cookie
        // Call `finishLogout` when logout is complete, passing an Error object
        // if there was an error
        logout: function (finishLogout) {
            finishLogout();
        }
    });

A Web Component developer may 

*/

'use strict';

var inherits = require('inherits');
var EventEmitter = require('event-emitter');
var log = require('debug')('auth');

/**
 * Create an Auth object
 * @param [opts] {object} Options to configure the Auth object
 */
module.exports = function createAuth(opts) {
    return new Auth(opts);
};

/**
 * An object which other components can use to trigger and monitor
 * end-user authentication on the host page
 * @constructor
 * @param [opts.user] The user model to set as .user. Usually you should
 *     not provide this, and an `auth/user` will be created for you
 */
function Auth (opts) {
    EventEmitter.apply(this, arguments);
    opts = opts || {};
    this.user = opts.user || require('auth/user');
    this._delegatee = null;
    this.delegate({});
}
inherits(Auth, EventEmitter);

/**
 * Delegate auth actions to the provided object
 * @param delegatee {object} The object to delegate actions to.
 *     It should implement .login, .logout functions.
 */
Auth.prototype.delegate = function (opts) {
    log('Auth#delegate', opts);
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
    log('Auth#login');
    var finishLogin = this._finishLogin.bind(this);
    this._delegatee.login.call(this._delegatee, finishLogin);
};

/**
 * Invoked via the callback passed to the delegatee's `.login` method
 * @param [err] An Error that ocurred when authenticating the end-user
 * @private
 */
Auth.prototype._finishLogin = function (err) {
    log('Auth#_finishLogin');
    this.emit('login');
};

/**
 * Try to facilitate deauthentication (logout) by the user
 */
Auth.prototype.logout = function () {
    log('Auth#logout');
    var finishLogout = this._finishLogout.bind(this);
    this._delegatee.logout.call(this._delegatee, finishLogout);
    this.emit('logout');
};

/**
 * Invoked via the callback passed to the delegatee's `.login` method
 * @param [err] An Error that ocurred when authenticating the end-user
 * @private
 */
Auth.prototype._finishLogout = function (err) {
    log('Auth#_finishLogout');
};
