'use strict';

var path = require('path'),
    fs = require('fs'),
    
    processItem = function(queue, previous, callback) {

        var item = '';

        if (!queue.length) {
            callback();
            return;
        }

        item = queue.shift();

        if (!item) {
            if (!queue.length) {
                callback();
                return;
            }
            item = queue.shift();
            item = path.sep + item;
        }

        if (previous) {
            item = path.join(previous, item);
        }

        fs.exists(item, function(exists) {

            if (exists) {
                processItem(queue, item, callback);
                return;
            }

            fs.mkdir(item, function(error) {

                if (error) {
                    callback(error);
                    return;
                }

                processItem(queue, item, callback);

            });

        });

    };

module.exports = function(dirname, callback) {

    processItem(dirname.split(path.sep), null, callback);

};

