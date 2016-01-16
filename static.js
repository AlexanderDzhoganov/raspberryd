var fs = require('fs');
var handlebars = require('handlebars');

handlebars.registerHelper("inc", function(value, options)
{
    return parseInt(value) + 1;
});

var templateCache = {};

function cacheTemplate(path) {
    return new Promise(function(resolve, reject) {
        fs.readFile(path, function(err, data) {
            if(err) {
                reject(err);
                return;
            }

            resolve(data.toString('utf-8'));
        });
    }).then(function(data) {
        templateCache[path] = handlebars.compile(data);
        return templateCache[path];
    }).catch(function(err) {
        console.error('Error reading "' + path + '" template, reason: ' + JSON.stringify(err, null, 4));
        return Promise.reject(err);
    });
}

function addTemplate(path) {
    fs.watchFile(path, function() {
        cacheTemplate(path);
    });

    return cacheTemplate(path);
}

exports.fromTemplate = function(path, data) {
    if(!templateCache[path]) {
        return addTemplate(path).then(function(template) {
            return Promise.resolve(template(data));
        });
    }

    return Promise.resolve(templateCache[path](data));
}
