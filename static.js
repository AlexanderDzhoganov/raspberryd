var fs = require('fs');
var handlebars = require('handlebars');

handlebars.registerHelper("inc", function(value, options)
{
    return parseInt(value) + 1;
});

var templateCache = {};

function addTemplate(path) {
    fs.watchFile(path, function() {
        fs.readFile(path, function(err, data) {
            if(err) {
                console.error('Error reading "' + path + '" template, reason: ' + JSON.stringify(err, null, 4));
                return;
            }

            console.log('Reloading ' + path);
            templateCache[path] = handlebars.compile(data.toString('utf-8'));
        })
    });

    templateCache[path] = handlebars.compile(fs.readFileSync(path).toString('utf-8'));
}

exports.compileTemplate = function(path, data) {
    if(!templateCache[path]) {
        addTemplate(path);
    }

    return templateCache[path](data);
}
