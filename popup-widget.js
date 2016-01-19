var _ = require('lodash');

var gui = require('./gui');

module.exports = function(text, timeout, opts) {
    var layer = 1000;
    this.bgWnd = gui.createWindow(0, 0, gui.screenSize.x, gui.screenSize.y, layer);

    this.destroy = function() {
        if(this.bgWnd) {
            this.bgWnd.destroy();
            this.bgWnd = null;
        }

        if(this.lblWnd) {
            this.lblWnd.destroy();
            this.lblWnd = null;
        }
    };

    if(!opts) {
        opts = {};
    }

    var fontSize = 32;
    if(opts.fontSize) {
        fontSize = opts.fontSize;
    }

    var textSize = this.bgWnd.measureText(text, fontSize);

    var padding = 48;
    if(opts.padding) {
        padding = opts.padding;
    }

    var bgColor = gui.colors.gray;
    if(opts.bgColor) {
        bgColor = opts.bgColor;
    }

    var textColor = gui.colors.white;
    if(opts.textColor) {
        textColor = opts.textColor;
    }

    var width = textSize.x + padding * 2;
    var height = textSize.y + padding;

    var x = (gui.screenSize.x - width) / 2;
    var y = (gui.screenSize.y - height) / 2;

    this.lblWnd = gui.createWindow(x + (width - textSize.x) / 2, y + (height - textSize.y) / 2 + 4,
        textSize.x, textSize.y, layer+1);

    this.drawWindow = function() {
        this.bgWnd.fillGradient(x, y, width, height, 
            gui.colors.black, bgColor, x, y, x, y + height, 12.0);

        this.lblWnd.drawText(0, 0, text, fontSize, textColor, gui.colors.transparent);

        if(opts.onDraw) {
            opts.onDraw(this.bgWnd);
        }

        this.bgWnd.update();
        this.lblWnd.update();
    };

    this.drawWindow();

    if(timeout) {
        setTimeout(function() {
            if(opts.onHide) {
                opts.onHide(this.wnd);
            }

            this.destroy();
        }.bind(this), timeout * 1000);
    }
};
