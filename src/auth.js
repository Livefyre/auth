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
var bind = require('./util/bind');

/**
 * An object which other components can use to trigger and monitor
 * end-user authentication on the host page
 * @constructor
 */
var Auth = module.exports = function () {
    var loggedIn = false;
    var creds;
    var isAuthenticated = false;
    EventEmitter.apply(this);
    this._delegate = {};

    // creds are private so these methods are added in the constructor
    var get = function get(name) {
        if ( ! name) {
            return creds;
        }
        return creds && creds[name];
    };

    this.on('login', function set(u) {
        creds = u;
        loggedIn = true;
        isAuthenticated = true;
    });
    this.on('authenticate', function () {
        isAuthenticated = true;
    });
    this.on('logout', function () {
        creds = null;
        loggedIn = false;
        isAuthenticated = false;
    });
    this.on('error', function (err) {
        log(err);
    });

    this.get = get;

    /**
     * Return whether the end-user is currently authenticated
     * @returns {Boolean}
     */
    this.isAuthenticated = function () {
        return isAuthenticated;
    };
};
inherits(Auth, EventEmitter);

/**
 * Delegate auth actions to the provided object
 * @param delegate {object} The object to delegate actions to.
 *     It should implement .login, .logout functions.
 */
Auth.prototype.delegate = function (newDelegate) {
    log('Auth#delegate', newDelegate);
    if (newDelegate.login) {
        this._delegate.login = bind(newDelegate.login, newDelegate);
    }
    if (newDelegate.logout) {
        this._delegate.logout = bind(newDelegate.logout, newDelegate);
    }
    this.emit('delegate', newDelegate);
    return this;
};

/**
 * Check whether a delegate has been set
 * @param delegateMethod {string} The name of the delegate method
 * @returns {Boolean}
 */
Auth.prototype.hasDelegate = function (delegateMethod) {
    if (delegateMethod === 'login' || delegateMethod === 'logout') {
        return this._delegate.hasOwnProperty(delegateMethod);
    }
    return !!this._delegate;
};

/**
 * Try to facilitate authentication (login) by the end user
 * @param callbackOrUser {function|object} Function to call after login, or a user
 *     if you have a user object to login
 * @public
 */
Auth.prototype.login = function (callbackOrUser) {
    if (callbackOrUser && typeof callbackOrUser !== 'function') {
        return this._loginUser(callbackOrUser);
    }
    var callback = callbackOrUser;
    log('Auth#login');
    var login = this._delegate.login;
    var finishLogin = callableOnce(function () {
        this._finishLogin.apply(this, arguments);
        if (typeof callback === 'function') {
            callback.apply(this, arguments);
        }
    }.bind(this));
    // finishLogin should be called by the delegate.logout when done
    login(finishLogin);
};

/**
 * Handle the login of a specific user
 */
Auth.prototype._loginUser = function (users) {
    this.emit('login', users);
    for (var plugin in users) {
        if (users.hasOwnProperty(plugin)) {
            this.emit('login.'+plugin, users[plugin]);
        }
    }
};

/**
 * Invoked via the callback passed to the delegate's `.login` method
 * @param [err] An Error that ocurred when authenticating the end-user
 * @private
 */
Auth.prototype._finishLogin = function (err, credentials) {
    log('Auth#_finishLogin', err, credentials);
    if (err) {
        this.emit('error', err);
        return;
    }
    if (! credentials) {
        log(['_finishLogin called without a truthy second parameter. The user',
             'cannot be authenticated.'].join(' '));
    }
    this._authenticate(credentials);
};

/**
 * Try to facilitate deauthentication (logout) by the user
 * @public
 */
Auth.prototype.logout = function (callback) {
    log('Auth#logout');
    var logout = this._delegate.logout;
    var noDelegateError = new Error('No logout auth delegate');

    // Error if there is no logout delegate
    if ( ! logout) {
        if (typeof callback === 'function') {
            callback(noDelegateError);
        } else {
            throw noDelegateError;
        }
        return;
    }

    var finishLogout = callableOnce(function () {
        this._finishLogout.apply(this, arguments);
        if (typeof callback === 'function') {
            callback.apply(this, arguments);
        }
    }.bind(this));
    // finishLogout should be called by the delegate.logout when done
    logout(finishLogout);
};

/**
 * Invoked via the callback passed to the delegate's `.logout` method
 * @param [err] An Error that ocurred when deauthenticating the end-user
 * @private
 */
Auth.prototype._finishLogout = function (err, logoutStatus) {
    log('Auth#_finishLogout', logoutStatus);
    if (err) {
        this.emit('error', err);
        return;
    }
    this.emit('logout');
};

/**
 * Authenticate the user with the provided credentials
 * This should be used to indicate that the user is already logged in.
 */
Auth.prototype.authenticate = function (credentials) {
    this._authenticate(credentials);
};

/**
 * Authenticate the user with the provided credentials
 * @protected
 * @param credentials - Something to authenticate the user with
 */
Auth.prototype._authenticate = function (credentials) {
    if ( ! credentials) {
        return;
    }
    for (var plugin in credentials) {
        if (credentials.hasOwnProperty(plugin)) {
            this.emit('authenticate.'+plugin, credentials[plugin]);
        }
    }
    this.emit('authenticate', credentials);
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
