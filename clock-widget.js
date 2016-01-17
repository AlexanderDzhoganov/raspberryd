var gui = require('./gui');

var wnd = gui.createWindow(0, 4, 200, 32, 10);
var screenSize = wnd.getDisplaySize();
wnd.setPosition(screenSize.x - 200, 4);

process.on('exit', function() {
    wnd.destroy();
});

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

    wnd.drawText(0, 0, hour + ':' + minute + ':' + second + ' ' + ampm, 32, gui.colors.white, gui.colors.black);
    wnd.update();
}

draw();
setInterval(draw, 1000);
