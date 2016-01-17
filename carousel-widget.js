var _ = require('lodash');

var gui = require('./gui');
var remote = require('./remote');

module.exports = function(items, cb, loadedCb) {
    this.wnd = gui.createWindow(0, 0, gui.screenSize.x, gui.screenSize.y, 60);
    this.items = items;

    var imgWidth = 272;
    var imgHeight = 380;

    var selectedIndex = 0;

    remote.onAnyButtonPressed(function(btn) {
        if(btn === 'KEY_LEFT' && selectedIndex > 0) {
            selectedIndex--;
            this.drawWindow();
        } else if(btn === 'KEY_RIGHT' && selectedIndex < this.items.length) {
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

    this.interval = null;
    this.loadResources().then(function() {
        console.log('resources loaded');
        loadedCb();
        this.drawWindow();
    }.bind(this));

    function xPosFromIndex(index) {
        if(index === selectedIndex) {
            return (gui.screenSize.x - imgWidth * 1.33) / 2;
        } else if(selectedIndex < index) {
            return (gui.screenSize.x - imgWidth) / 2 - 256 - ((imgWidth + 16) * (selectedIndex - index));
        } else {
            return (gui.screenSize.x - imgWidth) / 2 + 256 + ((imgWidth + 16) * (index - selectedIndex));
        }
    }

    function scaleFromIndex(index) {
        if(index === selectedIndex) {
            return 1.33;
        } else {
            return 1.0;
        }
    }

    this.drawWindow = function() {
        this.wnd.fill(0, 0, gui.screenSize.x, gui.screenSize.y, gui.colors.transparent);

        var i = 0;
        _.each(this.items, function(item) {
            var x = xPosFromIndex(i);
            var scale = scaleFromIndex(i);

            var width = imgWidth * scale;
            var height = imgHeight * scale;

            if(item.imageHandle) {
                this.wnd.drawImage(item.imageHandle, x, (gui.screenSize.y - height) / 2, width, height);
            } else {
                this.wnd.fill(x, (gui.screenSize.y - height) / 2, width, height, gui.colors.magenta);
            }

            i++;
        }.bind(this));

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
