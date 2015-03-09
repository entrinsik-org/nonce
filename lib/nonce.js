'use strict';

var uuid = require('node-uuid');
var TTLMAX = 2147483647;

/**
 * Nonce is a UUID that is created and cached until used.  When used, it is removed so that
 * a request cannot perform the same action more than once.  There is a TTL on the cache, so the store
 * does not continue to grow.
 *
 * @param cache - the hapi server cache
 * @param ttl - optional, the ttl for the nonces generated
 * @constructor
 */
function Nonce(cache, ttl) {
    this.cache = cache;
    this.ttl = ttl;
    if (this.ttl && this.ttl > TTLMAX) {
        this.ttl = TTLMAX;
    }
}

/**
 * Generates a new uid and stores the given payload
 *
 * @param payload - the info that should be stored with the nonce
 * @param done - calls back with an error or the generated uid
 */
Nonce.prototype.create = function (payload, done) {
    var self = this;
    var value = uuid.v1();
    self.cache.set(value, payload, this.ttl, function (err) {
        if (err) {
            done(new Error('Failed to create nonce value. ' + err));
        } else {
            done(null, value);
        }
    });
};

/**
 * Consumes the nonce so that it cannot be used again
 *
 * @param nonce - the nonce to be used
 * @param done - returns an error or the payload sent to create function
 */
Nonce.prototype.use = function (nonce, done) {
    var self = this;
    self.cache.get(nonce, function (err, item, cached) {
        if (err) return done(err);
        if (!cached) return done(new Error('Nonce already used.'));

        self.cache.drop(nonce, function (err) {
            if (err) {
                done(err);
            } else {
                done(null, item);
            }
        });
    });
};

exports.Nonce = Nonce;