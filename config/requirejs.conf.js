require.config({
  paths: {
    base64: 'lib/base64/base64',
    'event-emitter': 'lib/event-emitter/src/event-emitter',
    inherits: 'lib/inherits/inherits',
    md5: 'lib/js-md5/js/md5',
    sinon: 'lib/sinonjs/sinon',
    chai: 'node_modules/chai/chai',
    debug: 'lib/debug/debug'
  },
  packages: [{
    name: 'auth',
    location: 'src'
  },
  {
    name: 'auth-tests',
    location: 'test'
  }],
  shim: {
    'sinon': {
      exports: 'sinon'
    }
  }
});
