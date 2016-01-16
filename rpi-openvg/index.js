module.exports = function() {
    try {
        return require('./build/Release/openvg.node');
    } catch (err) {
        return require('./build/Debug/openvg.node');
    }
}
