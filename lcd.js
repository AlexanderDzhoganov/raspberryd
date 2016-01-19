var gpio = require('rpi-gpio');

var LCD_POWER_GPIO = 7;

var gpioReady = false;
var lcdPowered = false;

gpio.setup(LCD_POWER_GPIO, gpio.DIR_OUT, function() {
    gpioReady = true;
});

exports.setPower = function(powered) {
    if(!gpioReady) {
        console.error('LCD:setPower - GPIO is not ready');
        return;
    }

    if(powered) {
        console.log('Powering up LCD');
    } else {
        console.log('Powering down LCD');
    }

    gpio.write(LCD_POWER_GPIO, powered);
    lcdPowered = powered;
};

exports.cyclePower = function() {
    exports.setPower(!lcdPowered);
};
