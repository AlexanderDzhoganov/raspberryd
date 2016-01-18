var _ = require('lodash');

var gui = require('./gui');
var remote = require('./remote');

module.exports = function(items, cb, loadedCb) {
    this.wnd = gui.createWindow(0, 0, gui.screenSize.x, gui.screenSize.y, 60);
    this.items = items;

    var selectedIndex = 0;
    var prevIndex = 0;
    var animDelta = 0.0;

    this.doAnim = function() {
        this.drawWindow();

        setTimeout(function() {
            animDelta += 0.15;
            if(animDelta < 1.0) {
                this.doAnim();
            } else {
                animDelta = 1.0;
            }
        }.bind(this), 16);
    }

    remote.onAnyButtonPressed(function(btn) {
        if(!this.wnd) {
            return;
        }

        if(btn === 'KEY_LEFT' && selectedIndex > 0) {
            prevIndex = selectedIndex;
            animDelta = 0.0;
            selectedIndex--;
            this.doAnim();
        } else if(btn === 'KEY_RIGHT' && selectedIndex < this.items.length - 1) {
            prevIndex = selectedIndex;
            animDelta = 0.0;
            selectedIndex++;
            this.doAnim();
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

    var imgWidth = 364;

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

    function scaleFromIndexAnim(index) {
        var diff = selectedIndex - prevIndex;
        return scaleFromIndex(index + diff) * (1.0 - animDelta) + scaleFromIndex(index) * animDelta;
    }

    function xPosFromIndex(index) {
        var center = gui.screenSize.x / 2;

        if(index === selectedIndex) {
            return center - scaleFromIndex(index) * imgWidth * 0.5;
        } else if(selectedIndex < index) {
            return xPosFromIndex(index - 1) + scaleFromIndex(index) * imgWidth * 1.25;
        } else {
            return xPosFromIndex(index + 1) - scaleFromIndex(index) * imgWidth * 0.75;
        }
    }

    function xPosFromIndexAnim(index) {
        var diff = selectedIndex - prevIndex;
        return xPosFromIndex(index + diff) * (1.0 - animDelta) + xPosFromIndex(index) * animDelta;
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

    function fontSizeFromIndexAnim(index) {
        var diff = selectedIndex - prevIndex;
        return fontSizeFromIndex(index + diff) * (1.0 - animDelta) + fontSizeFromIndex(index) * animDelta;
    }

    var imgHeight = 380;

    this.renderItem = function(i) {
        var item = this.items[i];
        var x = xPosFromIndexAnim(i);
        var scale = scaleFromIndexAnim(i);
        var width = imgWidth * scale;
        var height = imgHeight * scale; 
        
        if(x > -width && x < gui.screenSize.x + width) {
            if(item.imageHandle) {
                var imageSize = item.imageHandle.getSize();
                var aspect = imageSize.x / imageSize.y;
                height = width / aspect;

                var handle = item.imageHandle;
                if(item.imageHandleHiRes) {
                    handle = item.imageHandleHiRes;
                }
                this.wnd.drawImage(handle, x, (gui.screenSize.y - height) / 2, width, height);

                if(!item.imageHandleHiRes && item.imageUrlHiRes && !item.imageHighResLoading) {
                    item.imageHighResLoading = true;
                    console.log('loading high res: ' + item.imageUrlHiRes);
                    gui.createImageFromUrl(item.imageUrlHiRes).then(function(image) {
                    console.log('loaded high res: ' + item.imageUrlHiRes);
                        item.imageHandleHiRes = image;
                        this.drawWindow();
                    }.bind(this));
                }
            } else {
                this.wnd.fill(x, (gui.screenSize.y - height) / 2, width, height, gui.colors.magenta);
            }

            var fontSize = fontSizeFromIndex(i);
            var textSize = this.wnd.measureText(item.title, fontSize);
            this.wnd.drawText(x + width * 0.5 - textSize.x * 0.5, (gui.screenSize.y - height) / 2 - textSize.y - 4, 
                item.title, fontSize, gui.colors.white, gui.colors.gray.set('a', 0.5));
        }
    };

    this.drawWindow = function() {
        if(!this.wnd) {
            return;
        }

        this.wnd.fill(0, 0, gui.screenSize.x, gui.screenSize.y, gui.colors.gray.set('a', 0.5));

        for(var i = Math.max(0, selectedIndex - 2); i < selectedIndex; i++) {
            this.renderItem(i);
        }

        for(var i = Math.min(this.items.length - 1, selectedIndex + 2); i > selectedIndex; i--) {
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

            if(item.imageHandleHiRes) {
                item.imageHandleHiRes.destroy();
            }
        });
    };
};
