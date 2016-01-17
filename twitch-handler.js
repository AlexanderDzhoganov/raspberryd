var child_process = require('child_process');
var fs = require('fs');
var _ = require('lodash');

var urlHandler = require('./url-handler');
var omxplayer = require('./omxplayer');
var util = require('./util');
var fifo = require('./fifo');
var remote = require('./remote');
var gui = require('./gui');
var brain = require('./brain');

var twitchAPI = require('./twitch-api');
var twitchChatWidget = require('./twitch-chat-widget');

var livestreamer = null;

var currentFifo = null;
var currentUri = null;
var currentQuality = 'high';
var channelInfo = null;
var channelBgImage = null;
var channelLogo = null;
var currentChat = null;

var backgroundWnd = gui.createWindow((gui.screenSize.x - 1280) / 2, (gui.screenSize.y - 720) / 2, 1280, 720, 15);
function setBackgroundImage(image) {
    backgroundWnd.drawImage(image);
    backgroundWnd.update();
}

var qualityWidget = null;
var favoritesWidget = null;
var streamsWidget = null;

var qualityOpts = ['source', 'high', 'medium', 'low', 'mobile', 'audio'];

function openUri(uri, quality) {
    console.log('Twitch handler: ' + uri);

    return twitchAPI.getChannelInfo(uri).then(function(info) {
        channelInfo = info;
        console.log('Channel info: ' + JSON.stringify(channelInfo));

        currentChat = new twitchChatWidget(channelInfo.name, 0, gui.screenSize.y - 40, 
            gui.screenSize.x, 40, 26, gui.colors.black);

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

    if(currentChat) {
        currentChat.destroy();
        currentChat = null;
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

remote.onButtonPressed('KEY_INFO', function() {
    if(currentUri) {
        var str = currentUri + ' [' + currentQuality + ']' +
            '\n' + channelInfo.status;
        new gui.widgets.popup(str, 2, {
            onDraw: function(wnd) {
                if(channelLogo) {
                    var size = { x: 300, y: 300 };
                    wnd.drawImage(channelLogo, (gui.screenSize.x - size.x) / 2, gui.screenSize.y - size.y - 16, size.x, size.y);
                }
            }
        });
    }
}, 1000);

remote.onButtonPressed('KEY_MENU', function() {
    if(qualityWidget) {
        qualityWidget.destroy();
        qualityWidget = null;
        return;
    }

    if(favoritesWidget) {
        favoritesWidget.destroy();
        favoritesWidget = null;
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

remote.onButtonPressed('KEY_DVD', function() {
    if(favoritesWidget) {
        favoritesWidget.destroy();
        favoritesWidget = null;
        return;
    }

    if(qualityWidget) {
        qualityWidget.destroy();
        qualityWidget = null;
    }

    var popup = new gui.widgets.popup('Loading favorites..');
    brain.recall('favorites').then(function(favorites) {
        popup.destroy();

        favoritesWidget = new gui.widgets.select('Favorites:', JSON.parse(favorites), null, function(err, uri) {
            if(err) {
                console.error(err);
                return;
            }

            closeUri().then(function() {
                openUri(uri);
            });
        });
    }).catch(function(err) {
        popup.destroy();
        new gui.widgets.popup(err, 4);
        console.error(err);
    });
}, 500);

remote.onButtonPressed('KEY_ESC', function() {
    if(favoritesWidget) {
        favoritesWidget.destroy();
        favoritesWidget = null;
    }

    if(qualityWidget) {
        qualityWidget.destroy();
        qualityWidget = null;
    }
}, 500);

remote.onButtonPressed('KEY_F1', function() {
    if(streamsWidget) {
        streamsWidget.destroy();
        streamsWidget = null;
        return;
    }

    var popup = new gui.widgets.popup('Loading info..');
    twitchAPI.getGames().then(function(games) {
        streamsWidget = new gui.widgets.carousel(_.map(games.top, function(info) {
            return {
                imageUrl: info.game.box.large,
                title: info.game.name
            };
        }), function(err, selected) {

        }, function() {
            popup.destroy();
        });
    }).catch(function(err) {
        popup.destroy();
        new gui.widgets.popup(err.toString(), 4);
        console.error(err);
    });
}, 500);

urlHandler.registerHandler('twitch.tv', openUri, closeUri);
