var auth = require('auth');
var Auth = require('auth/auth');
var assert = require('chai').assert;

describe('auth', function () {
    it('is a ', function () {
        assert(true);
    });
    describe('.create', function () {
        it('creates Auth objects', function () {
            var opts = {a: 1};
            var myAuth = auth.create(opts);
            assert.instanceOf(myAuth, Auth);
        });
    })
});
