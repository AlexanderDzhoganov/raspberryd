var request = require('request');
var _ = require('lodash');

var lirc_node = require('lirc_node');

exports.keys = {
    KEY_CHANNELUP: 'KEY_CHANNELUP',
    KEY_CHANNEL: 'KEY_CHANNEL',
    KEY_CHANNELDOWN: 'KEY_CHANNELDOWN',
    KEY_PREV: 'KEY_PREV',
    KEY_NEXT: 'KEY_NEXT',
    KEY_PLAYPAUSE: 'KEY_PLAYPAUSE',
    KEY_EQUAL: 'KEY_EQUAL'
};

exports.onButtonPressed = function(btn, cb, minTimeout) {
    var inTimeout = false;

    lirc_node.addListener(function(data) {
        if(inTimeout) {
            return;
        }

        if(btn == data.key.toString()) {
            cb();
            
            if(minTimeout) {
                inTimeout = true;
                setTimeout(function() {
                    inTimeout = false;
                }, minTimeout);
            }
        }
    });
};

exports.onAnyButtonPressed = function(cb, minTimeout) {
    var inTimeout = false;

    lirc_node.addListener(function(data) {
        if(inTimeout) {
            return;
        }

        cb(data.key.toString());

        if(minTimeout) {
            inTimeout = true;
            setTimeout(function() {
                inTimeout = false;
            }, minTimeout);
        }
    });
};
