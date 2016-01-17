var openvg = require('rpi-openvg')();
var request = require('request');
var png = require('pngjs').PNG;
var _ = require('lodash');

var wnd = new openvg.Window(0, 0, 1280, 800, 10.0);
//wnd.fill(0, 0, 600, 200, { r: 1.0, g: 1.0, b: 1.0, a: 1.0 });
//wnd.drawText(0, 0, 'Hello World!');

var img = null;

request({
    uri: 'http://i225.photobucket.com/albums/dd160/Tecguy2/batux-tux-g2-hd.png',
    method: 'GET',
    encoding: null
}, function(err, res, body) {
    new png({}).parse(body).on('parsed', function() {
        img = new openvg.Image(this.width, this.height);
        var status = img.setPixels(this.data, this.width, this.height);
        console.log('setting pixels: ' + status);

        status = wnd.blitImage(0, 0, 0, 0, img);
        console.log('blitting image: ' + status);
    });
});

setInterval(function() {
    wnd.update();
}, 100);
