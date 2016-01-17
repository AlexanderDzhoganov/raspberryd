var openvg = require('rpi-openvg')();
var request = require('request');
var png = require('pngjs').PNG;
var _ = require('lodash');

var screenSize = new openvg.Window(0, 0, 16, 16, 0).getDisplaySize();

function rgba(r, g, b, a) {
    return {
        r: r, g: g, b: b, a: a,
        set: function(prop, value) {
            var color = _.cloneDeep(this);
            color[prop] = value;
            return color;
        }
    };
};

var colors = {
    red: rgba(1.0, 0.0, 0.0, 1.0),
    green: rgba(0.0, 1.0, 0.0, 1.0),
    blue: rgba(0.0, 0.0, 1.0, 1.0),
    magenta: rgba(1.0, 0.0, 1.0, 1.0),
    cyan: rgba(0.0, 1.0, 1.0, 1.0),
    yellow: rgba(1.0, 1.0, 0.0, 1.0),
    white: rgba(1.0, 1.0, 1.0, 1.0),
    black: rgba(0.0, 0.0, 0.0, 1.0),
    transparent: rgba(0.0, 0.0, 0.0, 0.0),
    gray: rgba(0.25, 0.25, 0.25, 1.0),
    lightgray: rgba(0.75, 0.75, 0.75, 1.0)
};

exports.colors = colors;
exports.rgba = rgba;

exports.createWindow = function(x, y, width, height, layer) {
    return new openvg.Window(x, y, width, height, layer);
};

exports.createImage = function(width, height) {
    return new openvg.Image(width, height);
};

exports.createImageFromUrl = function(url) {
    return new Promise(function(resolve, reject) {
        request({
            uri: url,
            method: 'GET',
            encoding: null
        }, function(err, res, body) {
            if(err) {
                reject(err);
                return;
            }

            new png({}).parse(body).on('parsed', function() {
                img = new openvg.Image(this.width, this.height);
                var status = img.setPixels(this.data, this.width, this.height);
                if(status !== 0) {
                    reject('Failed to setPixels, status: ' + status);
                    return;
                }

                resolve(img);
            }).on('error', function(err) {
                reject(err);
            });
        });
    });
};

exports.createPopup = function(text, timeout, opts) {
    var wnd = new openvg.Window(0, 0, screenSize.x, screenSize.y, 1000);

    if(!opts) {
        opts = {};
    }

    var fontSize = 32;
    if(opts.fontSize) {
        fontSize = opts.fontSize;
    }

    var textSize = wnd.measureText(text, fontSize);

    var padding = 48;
    if(opts.padding) {
        padding = opts.padding;
    }

    var border = 2;
    if(opts.border) {
        border = opts.border;
    }

    var bgColor = colors.gray;
    if(opts.bgColor) {
        bgColor = opts.bgColor;
    }

    var borderColor = colors.lightgray;
    if(opts.borderColor) {
        borderColor = opts.borderColor;
    }

    var textColor = colors.white;
    if(opts.textColor) {
        textColor = opts.textColor;
    }

    var width = textSize.x + padding * 2 + border * 2;
    var height = textSize.y + padding + border * 2;

    var x = (screenSize.x - width) / 2;
    var y = (screenSize.y - height) / 2;

    var alpha = 1.0;

    function drawWindow() {
        wnd.fill(x, y, width, height, borderColor.set('a', alpha));
        wnd.fill(x + border, y + border, width - border * 2, height - border * 2, bgColor.set('a', alpha));

        wnd.drawText(x + (width - textSize.x) / 2, y + (height - textSize.y) / 2, text, 
            fontSize, textColor.set('a', alpha), bgColor.set('a', alpha));
        wnd.update();
    }

    var fadingOut = false;
    wnd.fadeOut = function() {
        if(!fadingOut) {
            fadingOut = true;
        } else {
            return;
        }

        var interval = setInterval(function() {
            drawWindow();
            alpha -= 0.05;
            if(alpha <= 0.0) {
                clearInterval(interval);
                wnd.hide();
            }
        }, 16);
    }

    drawWindow();

    if(timeout) {
        setTimeout(function() {
            wnd.fadeOut();
        }, timeout * 1000);
    }

    return wnd;
};
