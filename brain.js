var redis = require('redis');
var client = redis.createClient();

client.on('error', function(err) {
    console.log(err);
});

exports.remember = function(key, value) {
    return new Promise(function(resolve, reject) {
        client.set(key, value, function(err) {
            if(err) {
                reject(err);
                return;
            }

            resolve();
        });
    });
}

exports.recall = function(key) {
    return new Promise(function(resolve, reject) {
        client.get(key, function(err, value) {
            if(err) {
                reject(err);
                return;
            }

            resolve(value);
        });
    });
}

exports.forget = function(key) {
    return new Promise(function(resolve, reject) {
        client.del(key, function(err) {
            if(err) {
                reject(err);
                return;
            }

            resolve();
        });
    });
}
