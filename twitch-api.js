var _ = require('lodash');
var request = require('request');
var url = require('url');
var querystring = require('querystring');

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
            uri: 'https://api.twitch.tv/kraken/channels/' + querystring.escape(channel),
            json: true
        }, function(err, res, body) {
            if(err) {
                reject(err);
                return;
            }

            if(res.statusCode !== 200) {
                reject('http status: ' + res.statusCode);
                return;
            }

            resolve(body);
        });
    });
};

exports.getGames = function(limit, offset) {
    if(!limit) {
        limit = 10;
    }

    if(!offset) {
        offset = 0;
    }

    return new Promise(function(resolve, reject) {
        request({
            method: 'GET',
            uri: 'https://api.twitch.tv/kraken/games/top?limit=' + limit + '&offset=' + offset,
            json: true
        }, function(err, res, body) {
            if(err) {
                reject(err);
                return;
            }

            if(res.statusCode !== 200) {
                reject('http status: ' + res.statusCode);
                return;
            }

            resolve(body);
        });
    });
};

exports.getStreamsForGame = function(game, limit, offset) {
    if(!limit) {
        limit = 10;
    }

    if(!offset) {
        offset = 0;
    }

    return new Promise(function(resolve, reject) {
        request({
            method: 'GET',
            uri: 'https://api.twitch.tv/kraken/streams?game=' + querystring.escape(game),
            json: true
        }, function(err, res, body) {
            if(err) {
                reject(err);
                return;
            }

            if(res.statusCode !== 200) {
                reject('http status: ' + res.statusCode);
                return;
            }

            var streams = body.streams.slice(offset, offset + limit);
            resolve(streams);
        });
    });
};
