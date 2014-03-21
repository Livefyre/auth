/**
 * @fileoverview Simplified user object that looks like a Backbone model, but with only 'CHANGE'
 * and 'CLEAR' events.
 * Note that including this file will setup a global `window.livefyre.user`, but won't override
 * an existing object. Use at own risk.
 * This should be assumed to be a global singleton.
 */

var EventEmitter = require('event-emitter'),
    inherits = require('inherits'),
    jsonp = require('auth/util/jsonp'),
    storage = require('auth/util/storage'),
    AUTH_COOKIE_KEY = 'fyre-auth',
    AUTH_CREDS = 'fyre-authentication-creds';

/**
 * @param {Object} initialAttr
 * @constructor
 */
function LivefyreUser(initialAttr) {
    this._attributes = LivefyreUser.getDefaults();
    EventEmitter.call(this);
}
inherits(LivefyreUser, EventEmitter);

/** @return {Object.<string, *>} */
LivefyreUser.getDefaults = function() {
    return {
        'modMap': {},
        'keys': []
    };
};

/** @enum {string} */
LivefyreUser.EVENTS = {
    CHANGE: 'change',
    LOGOUT: 'logout',
    LOGIN: 'login',
    LOGIN_REQUESTED: 'loginRequested'
};

/**
 * @param {Object|string} keyOrObj
 * @param {*=} opt_value
 */
LivefyreUser.prototype.set = function(keyOrObj, opt_value) {
    var tempKey, k, val;
    // Assume object if not string
    if (typeof(keyOrObj) === 'string') {
        tempKey = keyOrObj;
        keyOrObj = {};
        keyOrObj[tempKey] = opt_value;
    }

    for (k in keyOrObj) {
        if (keyOrObj.hasOwnProperty(k)) {
            val = keyOrObj[k];
            this._attributes[k] = val;
            this.emit(LivefyreUser.EVENTS.CHANGE + ':' + k, val);
        }
    }
    this.emit(LivefyreUser.EVENTS.CHANGE, keyOrObj);
};

/**
 * Get a particular attribute
 * @param {string} key
 * @return {*}
 */
LivefyreUser.prototype.get = function(key) {
    if (!key) {
        return this._attributes;
    }
    return this._attributes[key];
};

/**
 * @param {string} key
 */
LivefyreUser.prototype.unset = function(key) {
    if (key in this._attributes) {
        delete this._attributes[key];
        var obj = {};
        obj[key] = void 0;
        this.emit(LivefyreUser.EVENTS.CHANGE + ':' + key, obj[key]);
    }
};

/**
 * Clear all attributes back to defaults.
 */
LivefyreUser.prototype.logout = LivefyreUser.prototype.reset = function() {
    this._attributes = {};
    this.set(LivefyreUser.getDefaults());
    storage.remove(AUTH_COOKIE_KEY);
    storage.remove(AUTH_CREDS);
    this.emit(LivefyreUser.EVENTS.LOGOUT);
};

/**
 * Simply sets the token. It is up to the authentication delegates to invoke the "remoteLogin"
 * by listening to "change:token".
 * @param {string} token
 */
LivefyreUser.prototype.login = function(token) {
    this.set('token', token);
    this.emit(LivefyreUser.EVENTS.LOGIN_REQUESTED, token);
};

/**
 * @param {Object} data
 * @param {string} articleId
 */
LivefyreUser.prototype.loadSession = function(data, articleId) {
    var profile = data['profile'],
        permissions = data['permissions'],
        authors = permissions['authors'],
        modKey = permissions['moderator_key'],
        storedModMap = data['mod_map'],
        tokenObj = data['token'],
        keys = [modKey],
        existingKeys = this.get('keys'),
        collectionId = data['collection_id'];

    profile['token'] = tokenObj['value'];

    for (var i = 0; i < authors.length; i++) {
        keys.push(authors[i]['key']);
    }
    this.set(profile);
    this.set('keys', existingKeys.concat(keys));

    if (storedModMap) {
        this.set('modMap', storedModMap);
    }

    var modMap = this.get('modMap');
    if (articleId && modKey) {
        modMap[articleId] = modKey;
    }
    if (collectionId && modKey) {
        modMap[collectionId] = modKey;
    }
    this.set('modMap', modMap);

    this.emit(LivefyreUser.EVENTS.LOGIN, data);
};

/**
 * Determines if this user is authenticated or not.
 * @return {boolean}
 */
LivefyreUser.prototype.isAuthenticated = function() {
    return !!this.get('id');
};

/**
 * @param {string} collectionId
 * @return {boolean}
 */
LivefyreUser.prototype.isMod = function(articleId) {
    return articleId in this.get('modMap');
};

/**
 * @param {string} opts.articleId
 * @param {string} opts.siteId
 * @param {string=} opts.serverUrl
 * @param {function()=} opts.callback
 */
LivefyreUser.prototype.remoteLogin = function(opts) {
    // TODO(rrp): uri param helper
    var queryParams = 'articleId=' + encodeURIComponent(opts.articleId) + '&siteId=' + opts.siteId,
        url = (opts.serverUrl || 'http://livefyre.com') + '/api/v3.0/auth/?' + queryParams,
        self = this,
        token = this.get('token'),
        bpChannel = this.get('bpChannel');

    url += token ? '&lftoken=' + encodeURIComponent(token) : '';
    url += bpChannel ? '&bp_channel=' + encodeURIComponent(bpChannel) : '';
    jsonp.req(url, function(err, resp) {
        if (err || (resp['data'] && !resp['data']['profile'])) {
            return;
        }
        var data = resp['data'],
            tokenObj = data['token'],
            ttl = (+new Date()) + tokenObj['ttl'] * 1000;
        self.loadSession(data, opts.articleId);
        data['mod_map'] = self.get('modMap');
        storage.set(AUTH_COOKIE_KEY, data, ttl);

        // Store authentication credentials, i.e. the token used for authenticating
        var authCreds = data['auth_token'];
        if (authCreds) {
            storage.set(AUTH_CREDS, authCreds['value'], (+new Date()) + authCreds['ttl'] * 1000);
        }

        opts.callback && opts.callback(data);
    });
};

/**
 * Set up singleton user object.
 */
module.exports = new LivefyreUser();
