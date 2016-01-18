var _ = require('lodash');

var gui = require('./gui');
var remote = require('./remote');

module.exports = function(title, options, selected, cb) {
    this.bgWnd = gui.createWindow(0, 0, gui.screenSize.x, gui.screenSize.y, 250);
    this.lblWnd = gui.createWindow(0, 0, gui.screenSize.x, gui.screenSize.y, 251);

    this.btnCallback = null;

    remote.onAnyButtonPressed(function(btn) {
        if(!this.btnCallback) {
            return;
        }

        this.btnCallback(btn);
    }.bind(this), 500);

    this.destroy = function() {
        if(this.bgWnd) {
            this.bgWnd.destroy();
            this.bgWnd = null;
        }

        if(this.lblWnd) {
            this.lblWnd.destroy();
            this.lblWnd = null;
        }
    
        this.btnCallback = null;
    };

    var longestEntry = '';
    var longestLength = 0;

    _.each(options, function(opt) {
        if(opt.length > longestLength) {
            longestLength = opt.length;
            longestEntry = opt;
        }
    });

    var entrySize = this.lblWnd.measureText(longestEntry, 32);

    var width = entrySize.x * 0.8 + 128;
    var height = 64 + options.length * 42 + 4;
    var x = (gui.screenSize.x - width) / 2;
    var y = (gui.screenSize.y - height) / 2;

    var borderColor = gui.colors.lightgray;
    var bgColor = gui.colors.gray;
    var textColor = gui.colors.white;
    var selectedColor = gui.rgba(0.0, 0.85, 0.15, 1.0);
    var alpha = 1.0;
    var border = 2;

    var selectedIndex = 0;
    for(var i = 0; i < options.length; i++) {
        if(options[i] == selected) {
            selectedIndex = i;
            break;
        }
    }

    this.drawWindow = function() {
        this.bgWnd.fillGradient(x, y, width, height, 
            gui.colors.black, bgColor, x, y, x, y + height, 12.0);

        var textSize = this.lblWnd.measureText(title, 24);
        this.lblWnd.drawText(x + (width - textSize.x) / 2, y + 8, title, 24, borderColor.set('a', alpha), gui.colors.transparent);

        var nextY = y + 64;
        for(var i = 0; i < options.length; i++) {
            var opt = options[i];

            var color = textColor;
            if(i == selectedIndex) {
                color = selectedColor;
            }

            textSize = this.lblWnd.measureText(opt, 32);
            this.lblWnd.drawText(x + (width - textSize.x) / 2, nextY, opt, 32, color.set('a', alpha), gui.colors.transparent);
            nextY += 42;
        }

        this.bgWnd.update();
        this.lblWnd.update();
    };

    this.btnCallback = function(btn) {
        if(btn == 'KEY_UP') {
            selectedIndex--;
            if(selectedIndex < 0) {
                selectedIndex = options.length - 1;
            }

            this.drawWindow();
        } else if(btn == 'KEY_DOWN') {
            selectedIndex++;
            if(selectedIndex >= options.length) {
                selectedIndex = 0;
            }

            this.drawWindow();
        } else if(btn == 'KEY_ENTER') {
            cb(null, options[selectedIndex], selectedIndex);
            this.destroy();
        }
    };

    this.drawWindow();
};
