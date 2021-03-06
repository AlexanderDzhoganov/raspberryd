var gui = require('./gui');

var wnd = gui.createWindow((gui.screenSize.x - 300) / 2, gui.screenSize.y - 128, 300, 64, 500);

function draw() {
    var date = new Date();
    
    var ampm = 'AM';
    var hour = date.getHours();
    if(hour > 12) {
        hour -= 12;
        ampm = 'PM';
    }

    if(hour < 10) {
        hour = '0' + hour.toString();
    } else {
        hour = hour.toString();
    }

    var minute = date.getMinutes();
    if(minute < 10) {
        minute = '0' + minute.toString();
    } else {
        minute = minute.toString();
    }

    var second = date.getSeconds();
    if(second < 10) {
        second = '0' + second.toString();
    } else {
        second = second.toString();
    }

    wnd.drawText(0, 0, hour + ':' + minute + ':' + second + ' ' + ampm, 48, gui.colors.white, gui.colors.transparent);
    wnd.update();
}

draw();
var interval = setInterval(draw, 1000);

exports.show = function() {
    wnd.show();
    if(!interval) {
        interval = setInterval(draw, 1000);
    }
};

exports.hide = function() {
    wnd.hide();

    if(interval) {
        clearInterval(interval);
        interval = null;
    }
};
