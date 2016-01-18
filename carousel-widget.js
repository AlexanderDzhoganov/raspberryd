var _ = require('lodash');

var gui = require('./gui');
var remote = require('./remote');

module.exports = function(items, cb, loadedCb) {
    this.wnd = gui.createWindow(0, 0, gui.screenSize.x, gui.screenSize.y, 60);
    this.items = items;

    var selectedIndex = 0;

    remote.onAnyButtonPressed(function(btn) {
        if(!this.wnd) {
            return;
        }

        if(btn === 'KEY_LEFT' && selectedIndex > 0) {
            selectedIndex--;
            this.drawWindow();
        } else if(btn === 'KEY_RIGHT' && selectedIndex < this.items.length - 1) {
            selectedIndex++;
            this.drawWindow();
        } else if(btn === 'KEY_ENTER') {
            cb(null, items[selectedIndex]);
            this.destroy();
        }
    }.bind(this), 500);

    this.loadResources = function() {
        console.log(JSON.stringify(this.items, null, 4));
        return Promise.all(_.map(this.items, function(item) {
            console.log('loading: ' + item.imageUrl);
            return gui.createImageFromUrl(item.imageUrl).then(function(image) {

                console.log('loaded: ' + item.imageUrl);
                item.imageHandle = image;
                return Promise.resolve();
            }).catch(function(err) {
                console.log('failed: ' + item.imageUrl);
                console.error(err);
                return Promise.resolve();
            });
        }));
    };

    var imgWidth = 272;

    this.interval = null;
    this.loadResources().then(function() {
        console.log('resources loaded');
        loadedCb();
        this.drawWindow();
    }.bind(this));

    function scaleFromIndex(index) {
        if(index === selectedIndex) {
            return 1.33;
        } else if(index === selectedIndex - 1 || index == selectedIndex + 1) {
            return 0.85;
        } else if(index === selectedIndex - 2 || index === selectedIndex + 2) {
            return 0.6;
        } else {
            return 0.25;
        }
    }

    function xPosFromIndex(index) {
        var center = gui.screenSize.x / 2;

        if(index === selectedIndex) {
            return center - scaleFromIndex(index) * imgWidth * 0.5;
        } else if(selectedIndex < index) {
            return xPosFromIndex(index - 1) + scaleFromIndex(index - 1) * imgWidth * 0.75 + 16;
        } else {
            return xPosFromIndex(index + 1) - scaleFromIndex(index - 1) * imgWidth * 0.75 - 16;
        }
    }

    function fontSizeFromIndex(index) {
        if(index === selectedIndex) {
            return 38;
        } else if(index === selectedIndex - 1 || index === selectedIndex + 1) {
            return 22;
        } else {
            return 12;
        }
    }

    var imgHeight = 380;

    this.renderItem = function(i) {
        var item = this.items[i];
        var x = xPosFromIndex(i);
        var scale = scaleFromIndex(i);
        var width = imgWidth * scale;
        var height = imgHeight * scale; 
        
        if(x > -width && x < gui.screenSize.x + width) {
            if(item.imageHandle) {
                var imageSize = item.imageHandle.getSize();
                var aspect = imageSize.x / imageSize.y;
                height = width / aspect;

                this.wnd.drawImage(item.imageHandle, x, (gui.screenSize.y - height) / 2, width, height);
            } else {
                this.wnd.fill(x, (gui.screenSize.y - height) / 2, width, height, gui.colors.magenta);
            }

            var fontSize = fontSizeFromIndex(i);
            var textSize = this.wnd.measureText(item.title, fontSize);
            this.wnd.drawText(x + width * 0.5 - textSize.x * 0.5, (gui.screenSize.y - height) / 2 - textSize.y - 4, 
                item.title, fontSize, gui.colors.white, gui.colors.transparent);
        }
    };

    this.drawWindow = function() {
        if(!this.wnd) {
            return;
        }

        this.wnd.fill(0, 0, gui.screenSize.x, gui.screenSize.y, gui.colors.white.set('a', 0.25));

        for(var i = Math.max(0, selectedIndex - 3); i < selectedIndex; i++) {
            this.renderItem(i);
        }

        for(var i = Math.min(this.items.length - 1, selectedIndex + 3); i > selectedIndex; i--) {
            this.renderItem(i);
        }

        this.renderItem(selectedIndex);
        this.wnd.update();
    };

    this.destroy = function() { 
        if(this.wnd) {
            this.wnd.destroy();
            this.wnd = null;
        }

        _.each(this.items, function(item) {
            if(item.imageHandle) {
                item.imageHandle.destroy();
            }
        });
    };
};
