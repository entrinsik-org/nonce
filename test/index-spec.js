'use strict';

var hapi = require('hapi');
var should = require('chai').should();
var plugin = require('..');

describe('Nonce Plugin', function () {
    var server;

    beforeEach(function () {
        server = new hapi.Server();
        server.connection();
    });

    afterEach(function (next) {
        server.stop(function () {
            next();
        });
    });

    it('should register', function (done) {
        server.register({ register: plugin.register }, function () {
            server.start(function () {
                var plugin = server.plugins['ent-nonce'];
                should.exist(plugin);
                should.exist(plugin.nonce);
                plugin.nonce.should.be.an('object');
                done();
            });
        });
    });

    it('should apply expiration settings', function (done) {
        server.register({ register: plugin.register , options: {expiresIn: 11111}}, function () {
            server.start(function () {
                var plugin = server.plugins['ent-nonce'];
                plugin.nonce.ttl.should.equal(11111);
                plugin.nonce.cache.rule.expiresIn.should.equal(11111);
                done();
            });
        });
    });

});