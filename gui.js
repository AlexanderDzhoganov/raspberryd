var fs = require('fs');
var request = require('request');
var png = require('pngjs').PNG;
var jpeg = require('jpeg-js');
var _ = require('lodash');

var openvg = require('rpi-openvg')();

function getScreenSize() {
    var tmp = new openvg.Window(0, 0, 16, 16, 0);
    var screenSize = tmp.getDisplaySize();
    tmp.destroy();
    tmp = null;
    return screenSize;
};

exports.screenSize = getScreenSize();

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

var windows = [];

function onExit() {
    console.log('Destroying ' + windows.length + ' windows');

    _.each(windows, function(window) {
        window.destroy();
    });

    process.exit(0);    
}

process.on('SIGHUP', onExit);
process.on('SIGTERM', onExit);
process.on('SIGINT', onExit);

exports.createWindow = function(x, y, width, height, layer) {
    var wnd = new openvg.Window(x, y, width, height, layer);
    windows.push(wnd);
    return wnd;
};

exports.createImage = function(width, height) {
    return new openvg.Image(width, height);
};

function getFileExtension(url) {
    return url.split('.').pop();
}

exports.createImageFromBuffer = function(extension, buffer) {
    return new Promise(function(resolve, reject) {
        if(extension === 'png') {
            new png({}).parse(buffer).on('parsed', function() {
                var img = new openvg.Image(this.width, this.height);
                var status = img.setPixels(this.data, this.width, this.height);
                if(status !== 0) {
                    reject('Failed to setPixels, status: ' + status);
                    return;
                }

                resolve(img);
            }).on('error', function(err) {
                reject(err);
            });
        } else if(extension === 'jpeg' || extension === 'jpg') {
            var image = jpeg.decode(buffer);
            if(!image) {
                reject('failed to decode jpeg');
                return;
            }

            var img = new openvg.Image(image.width, image.height);
            var status = img.setPixels(image.data, image.width, image.height);
            if(status !== 0) {
                reject('Failed to setPixels, status: ' + status);
                return;
            }

            resolve(img);
        } else {
            reject('unknown image extension: ' + extension);
        }
    });
};

exports.createImageFromFile = function(path) {
    return new Promise(function(resolve, reject) {
        fs.readFile(path, function(err, buffer) {
            if(err) {
                reject(err);
                return;
            }

            resolve(buffer);
        });
    }).then(function(buffer) {
        var extension = getFileExtension(path);
        return exports.createImageFromBuffer(extension, buffer);    
    });
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

            resolve(body);
        });
    }).then(function(buffer) {
        var extension = getFileExtension(url);
        return exports.createImageFromBuffer(extension, buffer);
    }); 
};

exports.widgets = {
    popup: require('./popup-widget'),
    select: require('./select-widget')
};
