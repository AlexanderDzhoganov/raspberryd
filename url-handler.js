var _ = require('lodash');
var url = require('url');

var handlers = {};
var cleanupHandler = null;
var lastUrl = null;

exports.callHandler = function(uri) {
    if(!uri.startsWith('http://') && !uri.startsWith('https://')) {
        uri = 'http://' + uri;
    }

    try {
        uri = url.parse(uri);
        var hostname = uri.hostname;
        uri = url.format(uri);

        if(hostname.startsWith('www.')) {
            hostname = hostname.slice(4);
        }

        if(handlers[hostname]) {
            var next = Promise.resolve();

            if(cleanupHandler) {
                next = cleanupHandler();
            }

            if(handlers[hostname].cleanupHandler) {
                cleanupHandler = handlers[hostname].cleanupHandler;
            } else {
                cleanupHandler = null;
            }

            lastUrl = uri;

            if(next.then) {
                return next.then(function() {
                    return handlers[hostname].handler(uri);
                });
            }

            return handlers[hostname].handler(uri);
        }

        return Promise.reject('handler not found');
    } catch (err) {
        console.error('Failed to call handler for "' + uri + '"..');
        console.error(err);
        return Promise.reject(err);
    }
}

exports.registerHandler = function(host, handler, cleanupHandler) {
    console.log('Registering handler for "' + host + '"');
    handlers[host] = { handler: handler, cleanupHandler: cleanupHandler };
}

exports.getLastUrl = function() {
    return lastUrl;
}
