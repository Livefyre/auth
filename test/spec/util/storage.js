/**
 * @fileoverview Storage tests - should be run in multiple environments as storage is inconsistent
 * and sometimes does not work well (even when it should).
 */

var storage = require('auth/util/storage');

describe('auth/util/storage', function() {
	it('plain set/get/remove', function() {
		var abc = storage.get('abc');
		chai.assert.isUndefined(abc);

		storage.set('abc', 'def');
		chai.assert.equal(storage.get('abc'), 'def');

		storage.remove('abc');
		chai.assert.isUndefined(storage.get('abc'));
	});

	it('expiration based set/get/remove', function(done) {
		storage.set('abc', 'def', (+new Date()) + 200); // expires in 200ms
		chai.assert.equal(storage.get('abc'), 'def');

		setTimeout(function() {
			chai.assert.isUndefined(storage.get('abc'));
			done();
		}, 300);
	});
});
