var openvg = require('rpi-openvg')();

setInterval(function() {
    openvg.renderNextFrame();
}, 100);

exports.setText = function(text) {
    console.log('Setting text to : ' + text);
    openvg.setText(text);
}
