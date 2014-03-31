var Auth = require('auth/auth');
var assert = require('chai').assert;

describe('auth/auth', function () {
    it('exports a constructor function', function () {
        assert.typeOf(Auth, 'function');
    });
});
