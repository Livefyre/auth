/**
 * @fileoverview Jsonp unit tests. Uses jsfiddle for server fun.
 */

var jsonp = require('auth/util/jsonp'),
	serverEcho = 'http://localhost:8090/echo/jsonp/',
	data = {
		'abc': 'def'
	};

describe('auth/util/jsonp', function() {
	this.timeout(10000);
	it('successfully makes request', function(done) {
		jsonp.req(serverEcho + '?data=' + JSON.stringify(data), function(error, response) {
			chai.assert(!error);
			chai.assert('abc' in data);
			chai.assert.equal('def', data['abc']);
			done();
		});
	});

	it('fails semi-gracefully', function(done) {
		jsonp.req('http://blah123abd.com', function(error, response) {
			chai.assert(error);
			chai.assert(!response);
			done();
		});
	});

	it('cleans up lingering globals and script tags', function(done) {
		jsonp.req(serverEcho + '?data=' + JSON.stringify(data), function(error, response) {
			// not sure how to do this otherwise
			for (var prop in window) {
				if (window.hasOwnProperty(prop)) {
                    if (prop.indexOf('_lfcallback_') > -1) {
                        chai.expect(window[prop]).to.be.undefined;
                    }
				}
			}

			var scripts = document.getElementsByName('script');
			for (var i = 0; i < scripts.length; ++i) {
				chai.assert(scripts[i].src.indexOf(serverEcho) < 0);
			}
			done();
		});
	});
});
