var authModule = require('auth');
var Auth = require('auth/auth');
var assert = require('chai').assert;
var sinon = require('sinon');

describe('auth/auth', function () {
    var auth;
    beforeEach(function () {
        auth = new Auth();
        auth.on('error', function (err) {});
    });
    it('a delegate can be passed to .delegate()', function () {
        assert.doesNotThrow(function () {
            auth.delegate({
                login: function () {}
            });
        });
    });
    describe('.get()', function () {
        it('returns falsy when the user has not logged in', function () {
            assert( ! auth.get());
        });
        it('returns named logins if passed a name', function (done) {
            auth.delegate({
                logout: function (done) {
                    done();
                }
            });
            var onLogin = sinon.spy(function () {
                assert(auth.get());
                auth.logout(function () {
                    assert( ! auth.get());
                    done();
                });
            });
            auth.on('login', onLogin);
            auth.login({
                vendor: 'v'
            });
        });
    });
    describe('.authenticate()', function () {
        describe('when passed a truthy parameter', function () {
            it('auth emits an authenticate event', function (done) {
                var onAuthenticate = sinon.spy(function (credentials) {
                    assert(auth.isAuthenticated());
                    done();
                });
                auth.on('authenticate', onAuthenticate);
                auth.authenticate('t');
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
        it('only uses first invocation of finishLogin', function (done) {
            var delegate = {
                login: sinon.spy(function (finishLogin) {
                    finishLogin(null, 1);
                    finishLogin(null, 2);
                    finishLogin(null, 3);
                })
            };
            auth.delegate(delegate);
            var onAuthenticate = sinon.spy();
            auth.on('authenticate', onAuthenticate);
            auth.login(function (err) {
                assert(onAuthenticate.calledOnce);
                assert.ok(onAuthenticate.lastCall.args[0] === 1, 'login was only fired once');
                done(err);
            });
        });
        describe('when passed a truthy parameter', function () {
            it('auth emits a login event', function (done) {
                var onLogin = sinon.spy(function (credentials) {
                    assert(auth.isAuthenticated());
                    done();
                });
                auth.on('login', onLogin);
                auth.login('t');
            });
        });
        describe('when passed a callback', function () {
            it('the callback is called on finishLogin', function (done) {
                var loginError = new Error();
                auth.delegate({
                    login: function (finishLogin) {
                        finishLogin(loginError);
                    }
                });
                var loginCallback = sinon.spy(function (err, creds) {
                    assert.equal(err, loginError);
                    done();
                });
                auth.login(loginCallback);
            });
            it('the callback is not called by another login invocation', function (done) {
                var i = 0;
                function increment() {
                    return ++i;
                }
                var afterLogin1 = sinon.spy(increment);
                var afterLogin2 = sinon.spy(increment);
                auth.delegate({
                    login: function (finishLogin) {
                            finishLogin(null, 'token');
                    }
                });

                auth.login(afterLogin1);
                auth.login(afterLogin2);

                var waitInterval = setInterval(function () {
                    console.log('incr', i);
                    if (i !== 2) {
                        return;
                    }
                    clearInterval(waitInterval);
                    assert.ok(afterLogin1.calledOnce);
                    assert.ok(afterLogin2.calledOnce);
                    done();
                }, 200);
            });
        });
        describe('passing a non-error to finishLogin', function () {
            it('auth emits a login event', function (done) {
                var credentials = 'token';
                var onAuthLogin = sinon.spy(function (creds) {
                    assert.equal(creds, credentials);
                    done();
                });
                auth.on('login', onAuthLogin);
                auth.login(credentials);
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
        it('throws if no logout delegate and no errback passed', function () {
            function logout() {
                auth.logout();
            }
            assert.throws(logout, 'No logout auth delegate');
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
    describe('.viewProfile()', function () {
        it('invokes delegate.viewProfile with the user object', function (done) {
            auth.delegate({
                viewProfile: function (user) {
                    assert(user);
                    done();
                }
            });
            auth.viewProfile(true);
        });
    });
    describe('.editProfile()', function () {
        it('invokes delegate.editProfile', function (done) {
            auth.delegate({
                editProfile: function (user) {
                    assert(user);
                    done();
                }
            });
            auth.editProfile(true);
        });
    });
});
