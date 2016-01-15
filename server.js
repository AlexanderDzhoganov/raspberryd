var express = require('express');
var fs = require('fs');
var querystring = require('querystring');
var _ = require('lodash');
var handlebars = require('handlebars');

var app = express();

var static = require('./static');
var player = require('./player');
var brain = require('./brain');
//var remote = require('./remote');

brain.recall('favorites', function(err, favorites) {
    if(err || !favorites || favorites.length === 0) {
        brain.remember('favorites', JSON.stringify(['', '', '', '', '', '', '', '', '']));
    }
});

player.getLastUrl(function(err, lastUrl) {
    if(err) {
        console.error(err);
        return;
    }

    if(lastUrl) {
        player.playUrl(lastUrl);
    }
});

app.get('/', function (req, res) {
    res.set('Content-Type', 'text/html');

    player.getLastUrl(function(err, lastUrl) {
        if(err) {
            console.error(err);
            res.end(new Buffer(err));
            return;
        }

        brain.recall('favorites', function(err, favorites) {
            if(err) {
                console.error(err);
                res.end(new Buffer(err));
                return;
            }

            favorites = JSON.parse(favorites);
            var html = static.compileTemplate('index.html', { favorites: favorites, lastUrl: lastUrl });
            res.end(new Buffer(html));
        });
    });
});

function handlePostRequest(req, res, cb) {
    var body = new Buffer(0);
    req.on('data', function(buf) {
        body = Buffer.concat([body, buf]);
    });

    req.on('end', function() {
        try {
            body = querystring.parse(body.toString('utf-8'));
        } catch (err) {
            res.redirect('/');
            cb(err, null);
            return;
        }

        console.log('[REQ] ' + JSON.stringify(body, null, 4));

        res.redirect('/');
        cb(null, body);
    });
}

app.post('/play_url', function(req, res) {
    handlePostRequest(req, res, function(err, body) {
        if(err) {
            console.error(err);
            return;
        }

        if(body.url) {
            player.playUrl(body.url);
        }
    });
});

app.post('/save_favorites', function(req, res) {
    handlePostRequest(req, res, function(err, body) {
        if(err) {
            console.error(err);
            return;
        }

        var favs = [];
        for(var i = 0; i < 9; i++) {
            favs.push(body['fav_' + (i + 1)]);
        }

        console.log(favs);
        brain.remember('favorites', JSON.stringify(favs));
    });
});

app.listen(3000, function () {
    console.log('Raspberryd listening on port 3000!');
});
