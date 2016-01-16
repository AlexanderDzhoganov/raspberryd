var child_process = require('child_process');
var fs = require('fs');

var urlHandler = require('./url-handler');
var omxplayer = require('./omxplayer');
var util = require('./util');
var fifo = require('./fifo');

var livestreamer = null;
var currentFifo = null;

urlHandler.registerHandler('twitch.tv', function(uri) {
    console.log('Twitch handler: ' + uri);

    livestreamer = child_process.spawn('livestreamer', [uri, 'source', '--quiet', '--stdout'], {
        stdio: ['ignore', 'pipe', process.stderr]
    });

    return fifo.createFifo().then(function(fifo) {
        currentFifo = fifo;
        livestreamer.stdout.pipe(fs.createWriteStream(currentFifo));
        console.log('Piping data to ' + currentFifo);
        omxplayer.play(currentFifo);
    });
}, function() {
    console.log('Twitch handler clean-up');

    if(livestreamer) {
        livestreamer.kill('SIGKILL');
        child_process.exec('killall -9 livestreamer');
    }

    omxplayer.stop();

    console.log('Sleeping for 3 seconds..');
    return util.sleep(3).then(function() {
        if(currentFifo) {
            return fifo.disposeFifo(currentFifo);
        }
    });
});
