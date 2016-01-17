var _ = require('lodash');

var gui = require('./gui');
var remote = require('./remote');

var screenSize = gui.createWindow(0, 0, 16, 16, 10).getDisplaySize();

var currentWnd = null;
var btnCallback = null;

remote.onAnyButtonPressed(function(btn) {
    if(!btnCallback) {
        return;
    }

    btnCallback(btn);
}, 500);

module.exports = function(title, options, selected, cb) {
    if(currentWnd) {
        currentWnd.destroy();
        currentWnd = null;
    }

    currentWnd = gui.createWindow(0, 0, screenSize.x, screenSize.y, 250);
    var wnd = currentWnd;

    wnd.destroy = function() {
        if(wnd) {
            wnd.destroy();
            wnd = null;
        }
    
        currentWnd = null;
        btnCallback = null;
    };

    var width = 256;
    var height = 64 + options.length * 42 + 4;
    var x = (screenSize.x - width) / 2;
    var y = (screenSize.y - height) / 2;

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

    function drawWindow() {
        wnd.fill(x, y, width, height, borderColor.set('a', alpha));
        wnd.fill(x + border, y + border, width - border * 2, height - border * 2, bgColor.set('a', alpha));

        var textSize = wnd.measureText(title, 24);
        wnd.drawText(x + (width - textSize.x) / 2, y + 8, title, 24, borderColor.set('a', alpha), bgColor.set('a', alpha));

        var nextY = y + 64;
        for(var i = 0; i < options.length; i++) {
            var opt = options[i];

            var color = textColor;
            if(i == selectedIndex) {
                color = selectedColor;
            }

            textSize = wnd.measureText(opt, 32);
            wnd.drawText(x + (width - textSize.x) / 2, nextY, opt, 32, color.set('a', alpha), bgColor.set('a', alpha));
            nextY += 42;
        }

        wnd.update();
    }

    btnCallback = function(btn) {
        if(btn == 'KEY_2') {
            selectedIndex--;
            if(selectedIndex < 0) {
                selectedIndex = options.length - 1;
            }

            drawWindow();
        } else if(btn == 'KEY_8') {
            selectedIndex++;
            if(selectedIndex >= options.length) {
                selectedIndex = 0;
            }

            drawWindow();
        } else if(btn == 'KEY_5') {
            cb(null, options[selectedIndex]);
            wnd.destroy();
            wnd = null;
            currentWnd = null;
            btnCallback = null;
        }
    }

    drawWindow();
    return wnd;
};
