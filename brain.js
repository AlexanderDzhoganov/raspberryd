var redis = require('redis');
var client = redis.createClient();

client.on('error', function(err) {
    console.log(err);
});

exports.remember = function(key, value) {
    client.set(key, value);
}

exports.recall = function(key, cb) {
    client.get(key, cb);
}

exports.forget = function(key) {
    client.del(key);
}
