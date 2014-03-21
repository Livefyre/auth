/**
 * @fileoverview Storage helpers: if window.localStroage is unavailable, then defaults to cookie
 * based storage. Automatically handles expiration and JSON serialization for both types of storage.
 */

var STORAGE_AVAILABLE_KEY = '__lfstorage__',
    canUseLocalStorage = (function() {
        try {
            // Weird cases where accessing localStorage global will throw an error.
            var storage = localStorage || null;
            // setItem will throw an exception if we cannot access WebStorage (e.g.,
            // Safari in private mode).
            storage.setItem(STORAGE_AVAILABLE_KEY, '1');
            storage.removeItem(STORAGE_AVAILABLE_KEY);
            return true;
        } catch (e) {
            return false;
        }
    })();

/**
 * LocalStorage storage object.
 * Attempts to rectify the many ways that browsers can interpret the localStorage object with heavy
 * use of try-catch blocks.
 */
var html5Storage = {
    /**
     * @param {string} key
     * @param {*} value
     * @param {number=} opt_expiration In UTC time
     */
    set: function(key, value, opt_expiration) {
        var valueObj = {
            value: value,
            expiration: opt_expiration || null
        };
        try {
            localStorage.setItem(key, JSON.stringify(valueObj));
        } catch(e) {}
    },

    /**
     * @param {string} key
     * @return {*=}
     */
    get: function(key) {
        try {
            var rawItem = localStorage.getItem(key);
            var valueObj = rawItem ? JSON.parse(rawItem) : {};

            /*
             * If stored object is expired:
             * - remove it
             * - return undefined
             */
            if (valueObj.expiration && valueObj.expiration < (+new Date())) {
                html5Storage.remove(key);
                return undefined;
            }

            return valueObj.value;
        } catch(e) {
            return undefined;
        }
    },

    /**
     * @param {string} key
     */
    remove: function(key) {
        try {
            localStorage.removeItem(key);
        } catch(e) {}
    }
};

/**
 * Cookie storage object.
 * Inspired by http://docs.closure-library.googlecode.com/git/closure_goog_net_cookies.js.source.html
 */
var cookieStorage = {
    /**
     * @param {string} key
     * @param {*} value
     * @param {number=} opt_expiration In UTC time
     */
    set: function(key, value, opt_expiration) {
        function convertExpiration(exp) {
            return new Date(exp).toUTCString();
        }

        var expiration, expiresStr, oneWeekMs = 604800000;

        if (opt_expiration > 0) {
            expiration = convertExpiration(opt_expiration);
        } else if (opt_expiration === 0) {
            expiration = ';expires=' + (new Date(1970, 1 /*Feb*/, 1)).toUTCString();
        } else {
            expiration = (+new Date() + oneWeekMs);
        }

        document.cookie = key + '=' + JSON.stringify(value) + expiresStr;
    },

    /**
     * @param {string} key
     * @return {*=}
     */
    get: function(key) {
        function getParts() {
            return document.cookie.split(/\s*;\s*/);
        }
        var keyEq = key + '=',
            parts = getParts();
        for (var i = 0, part; part = parts[i]; ++i) {
            // startsWith
            if (part.lastIndexOf(keyEq, 0) === 0) {
                return part.substr(keyEq.length);
            }
            if (part === key) {
                return '';
            }
        }
        return undefined;
    },

    /**
     * @param {string} key
     */
    remove: function(key) {
        cookieStorage.set(key, '', 0);
    }
};

module.exports = canUseLocalStorage ? html5Storage : cookieStorage;
