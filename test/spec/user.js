/**
 * @fileoverview global user singleton unit tests.
 */

var storage = require('auth/util/storage'),
    user = require('auth/user'),
    // TODO(rrp): This is already included in ./tests/fixtures/auth.json, so we should probably
    // just use one version.
    sampleProfile = {"collection_id": "0h hai", "profile":{"profileUrl":"admin.fy.re/profile/696/","settingsUrl":"admin.fy.re/profile/edit/info","displayName":"systemowner","avatar":"http://gravatar.com/avatar/f79fae57457a4204aeb07e92f81019bd/?s=50&d=http://d25bq1kaa0xeba.cloudfront.net/a/anon/50.jpg","id":"_u696@livefyre.com"},"auth_token":{"value":"eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJkb21haW4iOiAibGl2ZWZ5cmUuY29tIiwgImV4cGlyZXMiOiAxMzg5NTc0NzIzLjgyODUzOSwgInVzZXJfaWQiOiAiX3U2OTYifQ.wUFdqAPwCOzeuYcHVGdbVdAvdSto6Td65mfDlvDw-iY","ttl":2592000}, "token":{"value":"eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJkb21haW4iOiAibGl2ZWZ5cmUuY29tIiwgImV4cGlyZXMiOiAxMzg5NTc0NzIzLjgyODUzOSwgInVzZXJfaWQiOiAiX3U2OTYifQ.wUFdqAPwCOzeuYcHVGdbVdAvdSto6Td65mfDlvDw-iY","ttl":2592000},"version":"__VERSION__","isModAnywhere":true,"permissions":{"moderator_key":"8d565e9925fbd3aaf2e3dc989f4c58ab485574e8","authors":[{"id":"_u696@livefyre.com","key":"cbeee2ca676b7e9641f2c177d880e3ca3ecc295a"}]}},
    sampleStorage = JSON.parse(JSON.stringify(sampleProfile));
    sampleStorage['mod_map'] = {
        '123': sampleProfile['permissions']['moderator_key']
    };

describe('auth/user', function() {
    describe('is global', function() {
        it('has a fancy namespace', function() {
            chai.assert(typeof(user) === 'object');
            chai.assert(typeof(user.login) === 'function');
            chai.assert(typeof(user.logout) === 'function');
            chai.assert(typeof(user.on) === 'function');
            chai.assert(typeof(user.removeListener) === 'function');
        });
    });

    describe('spawns correct events', function() {
        it('fires change event', function() {
            var changeFired = false;
            user.on('change', function() {
                changeFired = true;
            });
            user.set('token', 'abc');
            chai.assert(changeFired);
        });
        it('fires loginRequested event', function() {
            var changeFired = false;
            user.on('loginRequested', function() {
                changeFired = true;
            });
            user.login('abcdefg');
            chai.assert(changeFired);
            user.logout();
        });
        it('fires logout event', function() {
            var logout = false;
            user.on('logout', function() {
                logout = true;
            });
            user.logout();
            chai.assert(logout);
        });
    });

    describe('isAuthenticated', function() {
        it('returns true if the user id is set', function() {
            user.set('id', 'abc');
            chai.expect(user.isAuthenticated()).to.be.true;
        });

        it('returns false if the user id is not set', function() {
            user.set('id', null);
            chai.expect(user.isAuthenticated()).to.be.false;
        });
    });

    describe('setters/getters/unsetters work', function() {
        it('sets and gets string key', function() {
            user.set('abc', 'def');
            chai.assert(user.get('abc') === 'def');
        });

        it('sets and gets object', function() {
            user.set({
                'abc': 'def',
                'ghi': 'jkl'
            });
            chai.assert(user.get('abc') === 'def');
            chai.assert(user.get('ghi') === 'jkl');

            var allAttr = user.get();
            chai.assert.equal(allAttr['abc'], 'def');
            chai.assert.equal(allAttr['ghi'], 'jkl');
            chai.assert(allAttr.modMap);
            chai.assert.equal(allAttr.keys.length, 0);
        });

        it('unsets key', function() {
            user.set('token', 'abc');
            user.unset('token');
            chai.assert(user.get('token') === undefined);
        });
    });

    describe('Login user and logout user correctly', function() {
        it('parses profile data', function() {
            user.loadSession(sampleProfile, '123');

            chai.assert(user.get('id') === '_u696@livefyre.com');
            chai.assert(user.isMod('123'));
            chai.assert(user.isMod(sampleProfile['collection_id']));
            chai.assert(user.get('profileUrl') === 'admin.fy.re/profile/696/');
            chai.assert(user.get('settingsUrl') === 'admin.fy.re/profile/edit/info');
            chai.assert(user.get('displayName') === 'systemowner');
            chai.assert(user.get('keys').length === 2);
            chai.assert(user.get('avatar') === 'http://gravatar.com/avatar/f79fae57457a4204aeb07e92f81019bd/?s=50&d=http://d25bq1kaa0xeba.cloudfront.net/a/anon/50.jpg');
            chai.assert(user.get('token') === sampleProfile['token']['value']);
            user.logout();
        });
        it('logout clears profile data', function() {
            user.set('token', 'abce');
            chai.assert(user.get('token'));

            user.logout();
            chai.assert(user.get('token') === undefined);
        });

        it('uses stored moderator data', function () {
            user.loadSession(sampleStorage);
            chai.assert(user.get('modMap')['123']);
            user.logout();
        });

        it('does not ingest absent article ids', function () {
            user.loadSession(sampleProfile);
            chai.assert(user.get('modMap')['123'] === undefined);
            user.logout();
        });
    });

    describe('Remote login works', function() {
        it('Hits "server" and parses profile', function(done) {
            user.remoteLogin({
                    articleId: '123',
                    siteId: '456',
                    serverUrl: 'http://localhost:8090',
                    callback: function() {
                        chai.assert(user.get('id') === '_u696@livefyre.com');
                        chai.assert(user.isMod('123'));
                        done();
                    }
            });
        });

        it('Sets and clear storage', function(done) {
            user.remoteLogin({
                articleId: '123',
                siteId: '456',
                serverUrl: 'http://localhost:8090',
                callback: function() {
                    var authData = storage.get('fyre-auth');
                    chai.assert.deepEqual(authData, sampleStorage);
                    user.logout();
                    authData = storage.get('fyre-auth');
                    chai.assert.isUndefined(authData);
                    done();
                }
            });
        });
    });
});
