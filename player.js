var child_process = require('child_process');
var urllib = require('url');
var brain = require('./brain');
var _ = require('lodash');

var currentProcess = null;

var commands = {
    'twitch.tv': function(url) {
        return 'livestreamer ' + url + ' source --fifo --player "omxplayer -r -o local"';
    },
    'www.twitch.tv': function(url) {
        return 'livestreamer ' + url + ' source --fifo --player "omxplayer -r -o local"';
    },
    'www.youtube.com': function(url) {
        return 'youtube-dl -qo - ' + url + ' > fifo | omxplayer -o local -r fifo';
    },
    'youtube.com': function(url) {
        return 'youtube-dl -qo - ' + url + ' > fifo | omxplayer -o local -r fifo';
    },
    'default': function(url) {
        return 'xinit -e "/usr/bin/chromium-browser --kiosk ' + url + '"';
    }
}

exports.getLastUrl = function(cb) {
    brain.recall('lastUrl', cb);
}

exports.playUrl = function(url) {
    brain.remember('lastUrl', url);

    var hostname = urllib.parse(url).hostname;
    var command = commands.default(url);

    if(commands[hostname]) {
        command = commands[hostname](url);
    }
    
    console.log('Running command: ' + command);

    if(currentProcess) {
        currentProcess.kill('SIGKILL');
        currentProcess = null;
        child_process.exec('killall -9 omxplayer.bin');
        child_process.exec('killall -9 chromium-browser');
        child_process.exec('killall -9 X');
    }

    currentProcess = child_process.exec(command, {}, function(error, stdout, stderr) {
        if(error) {
            console.error(error);
        }
    });
};
