var express = require('express');
var fs = require('fs');
var querystring = require('querystring');
var _ = require('lodash');
var handlebars = require('handlebars');

var app = express();

var static = require('./static');
var brain = require('./brain');
var remote = require('./remote');
var gui = require('./gui');
var lcd = require('./lcd');

remote.onButtonPressed('KEY_POWER', function() {
    lcd.cyclePower();
}, 1000);

var bgWindow = gui.createWindow(0, 0, gui.screenSize.x, gui.screenSize.y, 1);

gui.createImageFromFile('raspberry.jpg').then(function(bgImage) {
    bgWindow.drawImage(bgImage);
    bgWindow.update();
});

global.clock = require('./clock-widget');

global.showBackground = function() {
    bgWindow.show();
    clock.show();
};

global.hideBackground = function() {
    bgWindow.hide();
    clock.hide();
};

var urlHandler = require('./url-handler');
var twitchHandler = require('./twitch-handler');
var youtubeHandler = require('./youtube-handler');

app.get('*', function (req, res) {
    var path = req.path;

    if(path === '/') {
        path = 'index.html';
    } else {
        path = path.slice(1);
    }

    res.set('Content-Type', 'text/html');

    brain.recall('favorites').then(function(favorites) {
        return JSON.parse(favorites);
    }).then(function(favorites) {
        return brain.recall('lastUrl').then(function(lastUrl) {
            return { favorites: favorites, lastUrl: lastUrl };
        });
    }).then(function(data) {
        return static.fromTemplate(path, data);
    }).then(function(html) {
        res.status(200).end(new Buffer(html));
    }).catch(function(err) {
        res.status(503).end(JSON.stringify(err, null, 4));
    });
});

function handlePostRequest(req, res) {
    var body = new Buffer(0);

    req.on('data', function(buf) {
        body = Buffer.concat([body, buf]);
    });

    return new Promise(function(resolve, reject) {
        req.on('error', function(err) {
            reject(err);
        });

        req.on('end', function() {
            try {
                body = querystring.parse(body.toString('utf-8'));
            } catch (err) {
                reject(err);
                return;
            }

            console.log('[REQ] ' + JSON.stringify(body, null, 4));
            resolve(body);
        });
    });
}

app.post('/play_url', function(req, res) {
    handlePostRequest(req, res).then(function(body) {
        if(body.url) {
            bgWindow.show();
            urlHandler.callHandler(body.url).then(function() {
                bgWindow.hide();
            });
            new gui.widgets.popup('Switching to "' + body.url + '"', 5);
            brain.remember('lastUrl', body.url);
        }

        res.redirect('/');
    }).catch(function(err) {
        res.status(503).end(JSON.stringify(err, null, 4));
        console.error(err);
    });
});

app.post('/save_favorites', function(req, res) {
    handlePostRequest(req, res).then(function(body) {
        var favs = [];
        for(var i = 0; i < 9; i++) {
            favs.push(body['fav_' + (i + 1)]);
        }

        brain.remember('favorites', JSON.stringify(favs));
        res.redirect('/');
    }).catch(function(err) {
        res.status(503).end(JSON.stringify(err, null, 4));
        console.error(err);
    });
});

app.listen(3000, function () {
    console.log('Raspberryd listening on port 3000!');

    brain.recall('favorites').then(function(favorites) {
        if(!favorites) {
            brain.remember('favorites', JSON.stringify(['', '', '', '', '', '', '', '', '']));
        }
    }).catch(function(err) {
        console.error('Error loading favorites: ' + JSON.stringify(err, null, 4));
    });

    brain.recall('lastUrl').then(function(lastUrl) {
        if(lastUrl) {
            bgWindow.show();
            urlHandler.callHandler(lastUrl).then(function() {
                bgWindow.hide();
            });
        }
    }).catch(function(err) {
        console.error(err);
    });
});
