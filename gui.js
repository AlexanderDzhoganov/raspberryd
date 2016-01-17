var openvg = require('rpi-openvg')();
var request = require('request');
var png = require('pngjs').PNG;
var _ = require('lodash');

var wnd = new openvg.Window(0, 0, 1280, 800, 10.0);
wnd.fill(0, 0, 1280, 800, { r: 1.0, g: 1.0, b: 1.0, a: 0.5 });
//wnd.drawText(0, 0, 'Hello World!');

var img = null;

request({
    uri: 'https://www.wpclipart.com/blanks/shapes/color_labels/square/square_label_blue.png',
    method: 'GET',
    encoding: null
}, function(err, res, body) {
    new png({}).parse(body).on('parsed', function() {
        img = new openvg.Image(this.width, this.height);
        var status = img.setPixels(this.data, this.width, this.height);
        console.log('setting pixels: ' + status);

        status = wnd.drawImage(640, 400, 1280, 800, img);
        console.log('drawing image: ' + status);

        //status = wnd.blitImage(0, 0, 0, 0, img);
        //console.log('blitting image: ' + status);
    });
});

setInterval(function() {
    wnd.update();
}, 100);
