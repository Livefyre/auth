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
        // if there was an error, and authentication credentials if they have
        // been procured
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

A Web Component developer may wish to be notified when end-user authentication
status changes. For example, certain actions may only be enabled if the user
is authenticated. Or if the user is not authenticated, the component may wish
to render a 'Log in' link.

For these purposes, component developers can listen for events emitted by an
Auth object

    auth.on('login', setUserLoggedIn.bind(this, true));
    auth.on('logout', setUserLoggedIn.bind(this, false))

*/

'use strict';

var inherits = require('inherits');
var EventEmitter = require('event-emitter');
var log = require('debug')('auth');

/**
 * An object which other components can use to trigger and monitor
 * end-user authentication on the host page
 * @constructor
 */
var Auth = module.exports = function () {
    EventEmitter.apply(this);
    this._delegate = null;
};
inherits(Auth, EventEmitter);

/**
 * Return whether the end-user is currently authenticated
 * @returns {Boolean}
 */
Auth.prototype.isAuthenticated = function () {
    return Boolean(this._credentials);
};

/**
 * Delegate auth actions to the provided object
 * @param delegate {object} The object to delegate actions to.
 *     It should implement .login, .logout functions.
 */
Auth.prototype.delegate = function (opts) {
    log('Auth#delegate', opts);
    var lastdelegate = this._delegate || {
        login: log.bind(log, 'default login'),
        logout: log.bind(log, 'default logout')
    };
    this._delegate = {
        login: opts.login || lastdelegate.login,
        logout: opts.logout || lastdelegate.logout
    };
    return this;
};

/**
 * Try to facilitate authentication (login) by the end user
 * @public
 */
Auth.prototype.login = function () {
    log('Auth#login');
    // finishLogin should be called by the delegate.logout when done
    var finishLogin = callableOnce(this._finishLogin.bind(this));
    this._delegate.login.call(this._delegate, finishLogin);
};

/**
 * Invoked via the callback passed to the delegate's `.login` method
 * @param [err] An Error that ocurred when authenticating the end-user
 * @private
 */
Auth.prototype._finishLogin = function (loginStatus) {
    log('Auth#_finishLogin', loginStatus);
    var err = isError(loginStatus);
    if (err) {
        this.emit('error', err);
        return;
    }
    if (! loginStatus) {
        log(['_finishLogin called without a truthy first parameter. The user',
             'was not authenticated.'].join(' '));
    }
    this._authenticate(loginStatus);
};

/**
 * Try to facilitate deauthentication (logout) by the user
 * @public
 */
Auth.prototype.logout = function () {
    log('Auth#logout');
    // finishLogout should be called by the delegate.logout when done
    var finishLogout = callableOnce(this._finishLogout.bind(this));
    this._delegate.logout.call(this._delegate, finishLogout);
};

/**
 * Invoked via the callback passed to the delegate's `.logout` method
 * @param [err] An Error that ocurred when deauthenticating the end-user
 * @private
 */
Auth.prototype._finishLogout = function (logoutStatus) {
    log('Auth#_finishLogout', logoutStatus);
    var err = isError(logoutStatus);
    if (err) {
        this.emit('error', err);
        return;
    }
    this._authenticate(logoutStatus);
};

/**
 * Authenticate the user with the provided credentials
 * @protected
 * @param credentials - Something to authenticate the user with
 */
Auth.prototype._authenticate = function (credentials) {
    var oldCredentials = this._credentials;
    var credentialsChanged = (credentials !== oldCredentials);
    if ( ! credentialsChanged) {
        log('_authenticate called, but with same credentials. Returning early');
        return;
    }
    this._credentials = credentials;
    if (this.isAuthenticated()) {
        this.emit('login', credentials);
    } else {
        this.emit('logout', credentials);
    }
};

/**
 * Return the provided param if it is an error
 * else return null
 */
function isError(err) {
    if (err instanceof Error) {
        return err;
    }
    return null;
}

/**
 * Create a function that only does work the first time it is called
 * @param doWork {function} The Work to do. It will only be invoked once
 *     no matter how many times the returned function is invoked
 * @returns {function}
 */
function callableOnce(doWork, thisContext) {
    var callCount = 0;
    thisContext = thisContext || {};
    return function () {
        callCount++;
        if (callCount > 1) {
            log(['This function is only meant to be called once, but it was called ',
                 callCount, ' times'].join(''));
            return;
        }
        doWork.apply(thisContext, arguments);
    };
}
