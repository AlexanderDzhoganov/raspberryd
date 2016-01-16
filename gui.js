var openvg = require('rpi-openvg')();

var wnd = new openvg.Window(128, 128, 600, 200, 10.0);
wnd.fill(0, 0, 600, 200, { r: 1.0, g: 1.0, b: 1.0, a: 1.0 });
wnd.drawText(0, 0, 'Hello World!');

setInterval(function() {
    wnd.update();
}, 100);
