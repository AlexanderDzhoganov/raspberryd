var _ = require('lodash');
var request = require('request');
var url = require('url');

exports.getChannelInfo = function(uri) {
    try {
        uri = url.parse(uri);
    } catch(err) {
        return Promise.reject(err);
    }

    var channel = uri.path.slice(1);
    console.log('Getting channel info for: ' + channel);

    return new Promise(function(resolve, reject) {
        request({
            method: 'GET',
            uri: 'https://api.twitch.tv/kraken/channels/' + channel,
            json: true
        }, function(err, res, body) {
            if(err) {
                reject(err);
                return;
            }

            resolve(body);
        });
    });
};
