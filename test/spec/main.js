var auth = require('auth');
var Auth = require('auth/auth');
var assert = require('chai').assert;
var sinon = require('sinon');

describe('auth', function () {
    afterEach(function () {
        // reset the delegated methods
        auth.delegate({
            login: function (finishLogin) { finishLogin(); },
            logout: function (finishLogout) { finishLogout(); }
        });
    });
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
            assert(delegate.login.calledOnce,
                'delegate.login is called once');
            var delegateLoginCall = delegate.login.firstCall;
            assert(delegateLoginCall.args.length === 1,
                'delegate.login is passed one argument');
            var finishLogin = delegateLoginCall.args[0];
            assert.typeOf(finishLogin, 'function',
                'delegate.login arg is a callback function');
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
        describe('passing a non-error to finishLogin', function () {
            it('auth emits a login event', function () {
                var credentials = 'token';
                var onAuthLogin = sinon.spy();
                auth.delegate({
                    login: function (finishLogin) {
                        finishLogin(credentials);
                    }
                });
                auth.on('login', onAuthLogin);
                auth.login();
                assert(onAuthLogin.calledOnce);
                assert.equal(onAuthLogin.args[0], credentials);
            });
        });
        describe('passing an Error to finishLogin', function () {
            var loginError = new Error('user doesnt have cookies');
            var loginErrorDelegate = {
                login: function (finishLogin) {
                    finishLogin(loginError);
                }
            };
            beforeEach(function () {
                auth.delegate(loginErrorDelegate);
            });
            it('auth emits an error event', function () {
                var onAuthError = sinon.spy();
                auth.on('error', onAuthError);
                auth.login();
                assert(onAuthError.calledOnce);
                assert.equal(onAuthError.lastCall.args[0], loginError);
            });
            it('a login event is not emitted', function () {
                var onAuthLogin = sinon.spy();
                auth.on('login', onAuthLogin);
                auth.login();
                assert.equal(onAuthLogin.callCount, 0);
            });
        });
    });
    describe('.logout()', function () {
        it('invokes delegate.logout with a finishLogout callback', function () {
            var delegate = {
                logout: sinon.spy()
            };
            auth.delegate(delegate);
            auth.logout();
            assert(delegate.logout.calledOnce,
                'delegate.logout is called once');
            var delegateLogoutCall = delegate.logout.firstCall;
            assert(delegateLogoutCall.args.length === 1,
                'delegate.logout is passed one argument');
            var finishLogout = delegateLogoutCall.args[0];
            assert.typeOf(finishLogout, 'function',
                'delegate.logout arg is a callback function');
        });
        it('emits a logout event', function () {
            auth.delegate({
                logout: function (auth) { auth(); }
            });
            var onAuthLogout = sinon.spy();
            auth.on('logout', onAuthLogout);
            auth.logout();
            assert(onAuthLogout.calledOnce);
        });
    });
    describe('.isAuthenticated()', function () {
        it('returns falsy when the user has not logged in', function () {
            assert( ! auth.isAuthenticated());
        });
        it('returns truthy when the user has logged in', function () {
            auth.delegate({
                login: function (finishLogin) {
                    finishLogin('hi');
                }
            });
            auth.login();
            assert(auth.isAuthenticated());
            auth.logout();
            assert( ! auth.isAuthenticated());
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
