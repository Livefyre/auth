var log = require('debug')('auth');

var auth = module.exports = {
  user: require('auth/user')
};

/**
 * Delegate auth actions to the provided object
 * @param delegatee {object} The object to delegate actions to.
 *     It should implement .login, .logout functions.
 */
auth.delegate = function (delegatee) {
    this._delegatee = delegatee;
};

/**
 * Try to facilitate authentication (login) by the end user
 */
auth.login = function () {

};

/**
 * Try to facilitate deauthentication (logout) by the user
 */
auth.logout = function () {

};
