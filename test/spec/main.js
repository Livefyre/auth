var authModule = require('auth');
var Auth = require('auth/auth');
var assert = require('chai').assert;
var sinon = require('sinon');

describe('auth', function () {
    var auth;
    beforeEach(function () {
        // `authModule` is already an instance, but .creating beforeEach
        // takes care of resetting state across tests
        auth = authModule.create();
        auth.on('error', function (err) {});
    });
    it('a delegate can be passed to .delegate()', function () {
        assert.doesNotThrow(function () {
            auth.delegate({
                login: function () {}
            });
        });
    });
    describe('.authenticate()', function () {
        describe('when passed a truthy parameter', function () {
            it('auth emits a login event', function () {
                var onLogin = sinon.spy();
                auth.on('login', onLogin);
                auth.authenticate('t');
                assert(onLogin.calledOnce);
                assert(auth.isAuthenticated());
            });
        });
        describe('when passed a falsy parameter', function () {
            it('auth emits a logout event', function () {
                var onLogout = sinon.spy();
                auth.on('logout', onLogout);
                auth.authenticate(false);
                assert(onLogout.calledOnce);
                assert( ! auth.isAuthenticated());
            });
        });
    });
    describe('.login()', function () {
        describe('if delegate.login.length === 0', function () {
            it('assumes synchronous login', function () {
                var onAuthLogin = sinon.spy();
                var loginResult = 'myCredentials';
                auth.on('login', onAuthLogin);
                auth.delegate({
                    login: function () {
                        return loginResult;
                    }
                });
                auth.login();
                assert(onAuthLogin.calledOnce);
                assert.equal(onAuthLogin.lastCall.args[0], loginResult);
                assert(auth.isAuthenticated());
            });
        });
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
        describe('when passed a callback', function () {
            it('the callback is called on finishLogin', function () {
                var loginError = new Error();
                auth.delegate({
                    login: function (finishLogin) {
                        finishLogin(loginError);
                    }
                });
                var loginCallback = sinon.spy();
                auth.login(loginCallback);
                assert(loginCallback.calledOnce);
                assert.equal(loginCallback.lastCall.args[0], loginError);
            });
            it('the callback is not called by another login invocation', function () {
                var finishLogins = [];
                var afterLogin1 = sinon.spy();
                var afterLogin2 = sinon.spy();
                auth.delegate({
                    login: function (finishLogin) {
                        finishLogins.push(finishLogin);
                    }
                });
                auth.login(afterLogin1);
                auth.login(afterLogin2);
                
                var finishLogin1 = finishLogins[0];
                finishLogin1('token1');
                assert(afterLogin1.calledOnce);
                assert(afterLogin2.callCount === 0);
            });
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
        describe('if delegate.logout.length === 0', function () {
            it('assumes synchronous logout', function () {
                var onAuthLogout = sinon.spy();
                var logoutResult = null;
                auth.on('logout', onAuthLogout);
                auth.delegate({
                    logout: function () {
                        return logoutResult;
                    }
                });
                auth.logout();
                assert(onAuthLogout.calledOnce);
                assert.equal(onAuthLogout.lastCall.args[0], logoutResult);
                assert( ! auth.isAuthenticated());
            });
        });
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
        describe('when passed a callback', function () {
            it('the callback is called on finishLogout', function () {
                var logoutError = new Error();
                auth.delegate({
                    logout: function (finishLogout) {
                        finishLogout(logoutError);
                    }
                });
                var logoutCallback = sinon.spy();
                auth.logout(logoutCallback);
                assert(logoutCallback.calledOnce);
                assert.equal(logoutCallback.lastCall.args[0], logoutError);
            });
            it('the callback is not called by another login invocation', function () {
                var finishLogouts = [];
                var afterLogout1 = sinon.spy();
                var afterLogout2 = sinon.spy();
                auth.delegate({
                    logout: function (finishLogout) {
                        finishLogouts.push(finishLogout);
                    }
                });
                auth.logout(afterLogout1);
                auth.logout(afterLogout2);
                
                var finishLogout1 = finishLogouts[0];
                finishLogout1();
                assert(afterLogout1.calledOnce);
                assert(afterLogout2.callCount === 0);
            });
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
            var myAuth = authModule.create(opts);
            assert.instanceOf(myAuth, Auth);
        });
    });
});
