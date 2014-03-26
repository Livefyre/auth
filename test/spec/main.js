var auth = require('auth');
var Auth = require('auth/auth');
var assert = require('chai').assert;
var sinon = require('sinon');

describe('auth', function () {
    it('a delegate can be passed to .delegate()', function () {
        assert.doesNotThrow(function () {
            auth.delegate({
                login: function () {}
            });
        });
    });
    describe('.login()', function () {
        it('invokes delegate.login with a finishLogin callback', function () {
            var delegate = {
                login: sinon.spy()
            };
            auth.delegate(delegate);
            auth.login();
            assert(delegate.login.calledOnce, 'delegate.login is called once');
            var delegateLoginCall = delegate.login.firstCall;
            assert(delegateLoginCall.args.length === 1);
            var finishLogin = delegateLoginCall.args[0];
            assert.typeOf(finishLogin, 'function', 'passed arg is a callback');
        });
        it('only uses first invocation of finishLogin', function () {
            var delegate = {
                login: sinon.spy(function (finishLogin) {
                    finishLogin(1);
                    finishLogin(2);
                    finishLogin(3);
                })
            };
            var onLogin = sinon.spy();
            auth.on('login', onLogin);
            auth.delegate(delegate);
            auth.login();
            assert(onLogin.calledOnce);
            assert(onLogin.lastCall.args[0] === 1);
        });
    });
    describe('.create()', function () {
        it('creates Auth objects', function () {
            var opts = {a: 1};
            var myAuth = auth.create(opts);
            assert.instanceOf(myAuth, Auth);
        });
    });
});
