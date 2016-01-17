var _ = require('lodash');

var gui = require('./gui');
var chat = require('./twitch-chat');

module.exports = function(channel, x, y, width, height, fontSize, bgColor) {
    var lineHeight = fontSize + 4;
    this.maxMessages = height / lineHeight - 1;
    this.messages = [];

    this.chat = new chat(channel, function(nick, text) {
        if(!this.wnd) {
            return;
        }

        var text = nick + ': ' + text;
        this.messages.push(text);
        if(this.messages.length > this.maxMessages) {
            this.messages = this.messages.slice(this.messages.length - this.maxMessages);
        }

        this.drawWindow();
    }.bind(this));

    this.wnd = gui.createWindow(x, y, width, height, 55);

    this.destroy = function() {
        if(this.wnd) {
            this.wnd.destroy();
            this.wnd = null;
            console.log('Destroying chat window..');
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

        this.wnd.fill(0, 0, width, height, bgColor ? bgColor : gui.colors.transparent);

        var text = '';
        _.each(this.messages, function(message) {
            text += message + '\n';
        });

        this.wnd.drawText(0, 8, text, fontSize, gui.colors.white, gui.colors.transparent);
        this.wnd.update();
    };
};
