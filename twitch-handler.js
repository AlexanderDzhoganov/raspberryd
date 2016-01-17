var child_process = require('child_process');
var fs = require('fs');

var urlHandler = require('./url-handler');
var omxplayer = require('./omxplayer');
var util = require('./util');
var fifo = require('./fifo');
var remote = require('./remote');
var gui = require('./gui');
var twitchAPI = require('./twitch-api');

var livestreamer = null;
var currentFifo = null;
var currentUri = null;
var currentQuality = 'high';
var channelInfo = null;
var channelBgImage = null;
var channelLogo = null;

var backgroundWnd = gui.createWindow(0, 0, gui.screenSize.x, gui.screenSize.y, 15);
function setBackgroundImage(image) {
    backgroundWnd.drawImage(0, 0, gui.screenSize.x, gui.screenSize.y, image);
    backgroundWnd.update();
}

var qualityWidget = null;
var qualityOpts = ['source', 'high', 'medium', 'low', 'mobile', 'audio'];

function openUri(uri, quality) {
    console.log('Twitch handler: ' + uri);

    return twitchAPI.getChannelInfo(uri).then(function(info) {
        channelInfo = info;
        console.log('Channel info: ' + JSON.stringify(channelInfo));

        if(channelInfo.video_banner) {
            return gui.createImageFromUrl(channelInfo.video_banner);
        }

        return null;
    }).then(function(image) {
        channelBgImage = image;
        if(channelBgImage) {
            setBackgroundImage(channelBgImage);
        }

        if(channelInfo.logo) {
            return gui.createImageFromUrl(channelInfo.logo);
        }
        
        return null;
    }).then(function(logo) {
        channelLogo = logo;

        new gui.widgets.popup(channelInfo.status, 4);

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
            stdio: ['ignore', 'pipe', 'ignore']
        });

        livestreamer.on('error', function(err) {
            console.error('Livestreamer error: ' + err.toString());
        });

        livestreamer.on('exit', function(code, signal) {
            console.log('Livestreamer terminated, code: ' + code + ', signal: ' + signal);
        });

        return fifo.createFifo().then(function(fifo) {
            currentFifo = fifo;
            livestreamer.stdout.pipe(fs.createWriteStream(currentFifo)).on('error', function(err) {
                console.error('Livestreamer pipe error: ' + err.toString());
                livestreamer.kill('SIGKILL');
            });

            console.log('Piping data to ' + currentFifo);
            omxplayer.play(currentFifo);
        });
    }).catch(function(err) {
        console.error(err);
        new gui.widgets.popup(err.toString(), 6);
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
        new gui.widgets.popup(str, 2, {
            onDraw: function(wnd) {
                if(channelLogo) {
                    var size = { x: 300, y: 300 };
                    wnd.drawImage((gui.screenSize.x - size.x) / 2, gui.screenSize.y - size.y - 16, size.x, size.y, channelLogo);
                }
            }
        });
    }
}, 1000);

remote.onButtonPressed('KEY_EQUAL', function() {
    if(qualityWidget) {
        qualityWidget.destroy();
        qualityWidget = null;
        return;
    }

    if(!qualityOpts) {
        new gui.widgets.popup('No quality options on non-partnered streams.', 4);
        return;
    }

    qualityWidget = new gui.widgets.select('Select quality:', qualityOpts, currentQuality, function(err, quality) {
        if(err) {
            console.error(err);
            return;
        }

        if(currentQuality == quality) {
            return;
        }

        currentQuality = quality;
        new gui.widgets.popup('Stream quality is now [' + currentQuality + ']', 5);

        var uri = currentUri;
        closeUri().then(function() {
            openUri(uri);
        });
    });
}, 500);

urlHandler.registerHandler('twitch.tv', openUri, closeUri);
