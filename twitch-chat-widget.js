var _ = require('lodash');

var gui = require('./gui');
var chat = require('./twitch-chat');

module.exports = function(channel, x, y, width, height, fontSize) {
    var lineHeight = fontSize + 4;
    var maxMessages = height / lineHeight - 1;
    this.messages = [];

    this.chat = new chat(channel, function(nick, text) {
        if(!this.wnd) {
            return;
        }

        var text = nick + ': ' + text;
        this.messages.push(text);
        if(this.messages.length > maxMessages) {
            this.messages = messages.slice(messages.length - maxMessages);
        }

        this.drawWindow();
    }.bind(this));

    this.wnd = gui.createWindow(x, y, width, height, 55);

    this.destroy = function() {
        if(this.wnd) {
            this.wnd.destroy();
            this.wnd = null;
        }

        if(this.chat) {
            this.chat.destroy();
            this.chat = null;
        }
    };

    this.drawWindow = function() {
        if(!this.wnd) {
            return;
        }

        this.wnd.fill(0, 0, width, height, gui.colors.transparent);

        var text = '';
        _.each(this.messages, function(message) {
            text += message + '\n';
        });

        this.wnd.drawText(0, 0, text, fontSize, gui.colors.white, gui.colors.transparent);
        this.wnd.update();
    };
};
