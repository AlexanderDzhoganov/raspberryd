var child_process = require('child_process');
var fs = require('fs');

var urlHandler = require('./url-handler');
var omxplayer = require('./omxplayer');
var util = require('./util');
var fifo = require('./fifo');
var remote = require('./remote');
var gui = require('./gui');
var selectWidget = require('./select-widget');
var twitchAPI = require('./twitch-api');

var livestreamer = null;
var currentFifo = null;
var currentUri = null;
var currentQuality = 'high';
var channelInfo = null;

var qualityWidget = null;
var qualityOpts = ['source', 'high', 'medium', 'low', 'mobile', 'audio'];

function openUri(uri, quality) {
    console.log('Twitch handler: ' + uri);

    return twitchAPI.getChannelInfo(uri).then(function(info) {
        channelInfo = info;
        console.log('Channel info: ' + JSON.stringify(channelInfo));

        gui.createPopup(channelInfo.status, 4);

        if(channelInfo.partner) {
            qualityOpts = ['source', 'high', 'medium', 'low', 'mobile', 'audio'];
        } else {
            qualityOpts = null;
        }

        currentUri = uri;
        if(quality) {
            currentQuality = quality;
        }

        if(!currentQuality) {
            currentQuality = 'high';
        }

        livestreamer = child_process.spawn('livestreamer', [uri, currentQuality, '--quiet', '--stdout'], {
            stdio: ['ignore', 'pipe', process.stderr]
        });

        return fifo.createFifo().then(function(fifo) {
            currentFifo = fifo;
            livestreamer.stdout.pipe(fs.createWriteStream(currentFifo)).on('error', function(err) {
                console.error(err.toString());
                livestreamer.kill('SIGKILL');
                return openUri(uri);
            });

            console.log('Piping data to ' + currentFifo);
            omxplayer.play(currentFifo);
        });
    }).catch(function(err) {
        console.error(err);
        gui.createPopup(err.toString(), 6);
    });
};

function closeUri() {
    console.log('Twitch handler clean-up');

    if(livestreamer) {
        livestreamer.kill('SIGKILL');
        child_process.exec('killall -9 livestreamer');
    }

    omxplayer.stop();

    currentUri = null;

    console.log('Sleeping for 3 seconds..');
    return util.sleep(3).then(function() {
        if(currentFifo) {
            return fifo.disposeFifo(currentFifo).then(function() {
                currentFifo = null;
            });
        }
    });
};

remote.onButtonPressed('KEY_CHANNEL', function() {
    if(currentUri) {
        var str = currentUri + ' [' + currentQuality + ']' +
            '\n' + channelInfo.status;
        gui.createPopup(str, 2);
    }
}, 1000);

remote.onButtonPressed('KEY_EQUAL', function() {
    if(qualityWidget) {
        qualityWidget.closeWidget();
        qualityWidget = null;
        return;
    }

    if(!qualityOpts) {
        gui.createPopup('No quality options on non-partnered streams.', 4);
        return;
    }

    qualityWidget = selectWidget.createWidget('Select quality:', qualityOpts, currentQuality, function(err, quality) {
        if(err) {
            console.error(err);
            return;
        }

        currentQuality = quality;
        gui.createPopup('Stream quality is now [' + currentQuality + ']', 5);

        var uri = currentUri;
        closeUri().then(function() {
            openUri(uri);
        });
    });
}, 500);

urlHandler.registerHandler('twitch.tv', openUri, closeUri);
