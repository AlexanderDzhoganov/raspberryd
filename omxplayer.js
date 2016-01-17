var omx = require('omxdirector');

exports.play = function(filename) {
    omx.play(filename, { audioOutput: 'local', layer: 50 });
}

exports.pause = function() {
    omx.pause();
}

exports.stop = function() {
    omx.stop();
}
