'use strict';

var hoek = require('hoek');
var Nonce = require('./nonce').Nonce;
var TTLMAX = 2147483647;

var internals = {};

internals.defaults = {
    expiresIn: TTLMAX
};

exports.register = function (server, opts, next) {
    server.log(['Nonce', 'plugin', 'info', 'startup'], 'Starting');
    var settings = hoek.applyToDefaults(internals.defaults, opts);
    var nonce = new Nonce(server.cache(settings), settings.expiresIn);
    server.expose('nonce', nonce);
    next();
};

exports.register.attributes = {
    pkg: require('../package.json')
};

exports.Nonce = Nonce;