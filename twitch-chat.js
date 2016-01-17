var _ = require('lodash');
var irc = require('irc');

var serverUrl = 'irc.twitch.tv';

var username = 'psi_nlight';
var password = 'oauth:utgx2t0aown8z8g013o3hp2hddw5iw';

module.exports = function(channel, cb) {
    this.client = new irc.Client(serverUrl, username, {
        channels: ['#' + channel],
        port: 6667,
        autoRejoin: true,
        sasl: true,
        nick: username,
        username: username,
        password: password
    });

    this.client.on('registered', function() {
        console.log('Connected to Twitch IRC!');
    });

    this.client.on('message#' + channel, function(nick, text, message) {
        cb(nick, text);
    });

    this.destroy = function() {
        this.client.disconnect();
        this.client = null;
    }
};
