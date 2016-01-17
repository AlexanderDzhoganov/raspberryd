var _ = require('lodash');

var gui = require('./gui');

module.exports = function(text, timeout, opts) {
    this.wnd = gui.createWindow(0, 0, gui.screenSize.x, gui.screenSize.y, 1000);

    this.destroy = function() {
        if(this.wnd) {
            this.wnd.destroy();
            this.wnd = null;
        }
    };

    if(!opts) {
        opts = {};
    }

    var fontSize = 32;
    if(opts.fontSize) {
        fontSize = opts.fontSize;
    }

    var textSize = this.wnd.measureText(text, fontSize);

    var padding = 48;
    if(opts.padding) {
        padding = opts.padding;
    }

    var border = 2;
    if(opts.border) {
        border = opts.border;
    }

    var bgColor = gui.colors.gray;
    if(opts.bgColor) {
        bgColor = opts.bgColor;
    }

    var borderColor = gui.colors.lightgray;
    if(opts.borderColor) {
        borderColor = opts.borderColor;
    }

    var textColor = gui.colors.white;
    if(opts.textColor) {
        textColor = opts.textColor;
    }

    var width = textSize.x + padding * 2 + border * 2;
    var height = textSize.y + padding + border * 2;

    var x = (gui.screenSize.x - width) / 2;
    var y = (gui.screenSize.y - height) / 2;

    this.wnd.alpha = 1.0;

    this.drawWindow = function() {
        this.wnd.fill(x, y, width, height, borderColor.set('a', this.wnd.alpha));
        this.wnd.fill(x + border, y + border, width - border * 2, height - border * 2, bgColor.set('a', this.wnd.alpha));

        this.wnd.drawText(x + (width - textSize.x) / 2, y + (height - textSize.y) / 2, text, 
            fontSize, textColor.set('a', this.wnd.alpha), bgColor.set('a', this.wnd.alpha));

        if(opts.onDraw) {
            opts.onDraw(this.wnd);
        }

        this.wnd.update();
    }

    var fadingOut = false;
    this.fadeOut = function() {
        if(!fadingOut) {
            fadingOut = true;
        } else {
            return;
        }

        var interval = setInterval(function() {
            this.drawWindow();
            this.wnd.alpha -= 0.05;
            if(this.wnd.alpha <= 0.0) {
                clearInterval(interval);
                this.wnd.hide();
            }
        }.bind(this), 16);
    }

    this.drawWindow();

    if(timeout) {
        setTimeout(function() {
            this.fadeOut();
        }.bind(this), timeout * 1000);
    }
};
