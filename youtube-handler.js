var child_process = require('child_process');
var fs = require('fs');

var urlHandler = require('./url-handler');
var omxplayer = require('./omxplayer');
var util = require('./util');
var fifo = require('./fifo');

var youtubedl = null;
var currentFifo = null;

urlHandler.registerHandler('youtube.com', function(uri) {
    console.log('YouTube handler: ' + uri);

    youtubedl = child_process.spawn('youtube-dl', ['-q', '-o', '-', uri], {
        stdio: ['ignore', 'pipe', process.stderr]
    });

    return fifo.createFifo().then(function(fifo) {
        currentFifo = fifo;
        youtubedl.stdout.pipe(fs.createWriteStream(currentFifo));
        console.log('Piping data to ' + currentFifo);
        omxplayer.play(currentFifo);
    });
}, function() {
    console.log('YouTube handler clean-up');

    if(youtubedl) {
        youtubedl.kill('SIGKILL');
        child_process.exec('killall -9 python');
    }

    omxplayer.stop();

    console.log('Sleeping for 3 seconds..');
    return util.sleep(3).then(function() {
        if(currentFifo) {
            return fifo.disposeFifo(currentFifo);
        }
    });
});
