var request = require('request');
var _ = require('lodash');

var lirc_node = require('lirc_node');

var player = require('./player');
var brain = require('./brain');

var streams = null;
var currentStream = null;
var streamChangeDelay = null;

function changeStream() {
    player.playUrl(streams[currentStream]);
}

function fetchStreams() {
    request({
        uri: 'https://api.twitch.tv/kraken/streams',
        json: true
    }, function(err, res, body) {
        if(err) {
            console.error(err);
            return;
        }

        streams = _.map(body.streams, function(stream) {
            return stream.channel.url;
        });
    });
}

fetchStreams();
setInterval(fetchStreams, 60000);

function openFavoriteUrl(index) {
    brain.recall('favorites', function(err, favorites) {
        if(err) {
            console.error(err);
            return;
        }

        favorites = JSON.parse(favorites);

        if(index < 0 || index >= 10) {
            return;
        }

        var url = favorites[index];
        player.playUrl(url);
    });
}

lirc_node.addListener(function(data) {
    if(streamChangeDelay <= Date.now()) {
        streamChangeDelay = null;
    } else {
        return;
    }

    streamChangeDelay = Date.now() + 600;

    if(streams == null || streams.length === 0) {
        console.error('No streams available!');
        return;
    }

    var key = data.key.toString();
    if(key === 'KEY_CHANNELUP') {
        console.log('[RMT] CHANNEL+');

        currentStream++;
        if(currentStream >= streams.length) {
            currentStream = 0;
        }

        changeStream();
    } else if(key === 'KEY_CHANNELDOWN') {
        console.log('[RMT] CHANNEL-');

        currentStream--;
        if(currentStream < 0) {
            currentStream = streams.length - 1;
        }

        changeStream();
    } else if(key === 'KEY_1' || key === 'KEY_2' || key === 'KEY_3' || key === 'KEY_4' ||
            key === 'KEY_5' || key === 'KEY_6' || key === 'KEY_7' || key === 'KEY_8' || key === 'KEY_9') {
        openFavoriteUrl(parseInt(key[4]) - 1);
    }
});
