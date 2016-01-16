var tmp = require('tmp');
var child_process = require('child_process');

function system(cmd) {
    return new Promise(function(resolve, reject) {
        child_process.exec(cmd, {}, function(err) {
            if(err) {
                reject(err);
                return;
            }

            resolve();
        });
    });
}

function mkfifo(path) {
    return system('mkfifo ' + path).then(function() {
        return path;
    });
}

function rmfifo(path) {
    return system('rm -f ' + path);
}

function tmpname() {
    return new Promise(function(resolve, reject) {
        tmp.tmpName(function(err, path) {
            if(err) {
                reject(err);
                return;
            }

            resolve(path);
        });
    });
}

exports.createFifo = function() {
    return tmpname().then(function(path) {
        return mkfifo(path);
    });
}

exports.disposeFifo = function(path) {
    return rmfifo(path);
}
