var Auth = require('./auth');

var createAuth = function (opts) {
    return new Auth(opts);
};

exports = module.exports = createAuth();
exports.create = createAuth;
