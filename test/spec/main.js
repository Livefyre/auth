var authModule = require('auth');
var Auth = require('auth/auth');
var assert = require('chai').assert;
var sinon = require('sinon');

describe('auth', function () {
    describe('.create()', function () {
        it('creates Auth objects', function () {
            var opts = {a: 1};
            var myAuth = authModule.create(opts);
            assert.instanceOf(myAuth, Auth);
        });
    });
});
