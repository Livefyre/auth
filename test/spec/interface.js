var assert = require('chai').assert;
var auth = require('auth');
var authInterface = require('auth/contrib/auth-interface');

describe('auth/contrib/auth-interface', function () {
    it('lists all of the public properties on the auth module', function () {
        for (var key in auth) {
            if ( ! key.indexOf('_')) {
                assert(authInterface.indexOf(key), 'Missing ' + key + ' in interface');
            }
        }
    });
});
