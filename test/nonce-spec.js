'use strict';

var Nonce = require('../lib/nonce').Nonce;
var hapi = require('hapi');
var chai = require('chai');
var should = chai.should();
var sinon = require('sinon');
chai.use(require('sinon-chai'));

describe('Nonce', function () {
    var nonce;
    var server;
    var cache;

    beforeEach(function (next) {
        server = new hapi.Server({
            cache: require('catbox-memory')
        });

        server.connection({ routes: { cors: true } });

        server.start(function () {
            cache = server.cache({ segment: 'nonce', expiresIn: 60 * 60 * 1000 });
            nonce = new Nonce(cache);
            next();
        });
    });

    afterEach(function (next) {
        server.stop(function () {
            next();
        });
    });

    it('should generate and cache a new uid', function (done) {
        nonce.create('My Payload', function (err, value) {
            should.not.exist(err);
            should.exist(value);
            done();
        });
    });

    it('should consume an nonce and return the original payload', function (done) {
        nonce.create('My New Payload', function (err, value) {
            should.exist(value);
            nonce.use(value, function (err, payload) {
                should.not.exist(err);
                should.exist(payload);
                payload.should.equal('My New Payload');
                done();
            });
        });
    });

    it('should not allow subsequent uses', function (done) {
        nonce.create('My Fancy Payload', function (err, value) {
            should.exist(value);
            nonce.use(value, function (err, payload) {
                should.exist(payload);
                nonce.use(value, function (err, payload2) {
                    should.exist(err);
                    should.not.exist(payload2);
                    done();
                });
            });
        });
    });

    it('should set TTL to max if greater than the max allowed by catbox', function () {
        var MORETHANMAX = 2147483648;
        var MAX = 2147483647;
        nonce = new Nonce(server.cache({ segment: 'testing', expiresIn: MORETHANMAX }), MORETHANMAX);
        nonce.ttl.should.equal(MAX);
    });

    it('should fail to create an nonce if cache fails', function (done) {
        cache._cache.connection.stop();
        nonce.create('My Doomed Payload', function (err, value) {
            should.exist(err);
            should.not.exist(value);
            done();
        });
    });

    it('should fail to use an nonce if cache fails', function (done) {
        nonce.create('My Unreachable Payload', function (err, value) {
            should.exist(value);
            cache._cache.connection.stop();
            nonce.use(value, function (err, payload) {
                should.exist(err);
                should.not.exist(payload);
                done();
            });
        });
    });

    it('should fail to use an nonce if it cannot be deleted from cache', function (done) {
        sinon.stub(nonce.cache, 'get').yields(null, 'My Unreachable Payload', {item: 'My Unreachable Payload'});
        var dropSpy = sinon.spy(nonce.cache, 'drop');
        nonce.create('My Unreachable Payload', function (err, value) {
            should.exist(value);
            cache._cache.connection.stop();
            nonce.use(value, function (err, payload) {
                should.exist(err);
                should.not.exist(payload);
                dropSpy.should.have.been.calledOnce;
                done();
            });
        });
    });


});