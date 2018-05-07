'use strict';

var fs = require('fs'),
    path = require('path');

var AppHandler = require('./app-handler');

module.exports = class AppManager {

    construct(config, directories, logger, callback) {

        var key = '',
            entry = null,
            handler = null,
            toLoad = 0,
            
            loadConfig = function(handler) {

                var filename = path.join(directories.config, handler.name + '.json');

                fs.access(filename, fs.constants.R_OK | fs.constants.W_OK, (error) => {

                    if (error) {
                        callback(error);
                        return;
                    }

                    fs.readFile(filename, { encoding: 'utf8' }, (error, data) => {

                        if (error) {
                            callback(error);
                            return;
                        }

                        var jsonData = null;

                        try {
                            jsonData = JSON.parse(data);
                        } catch (error) {
                            callback(error);
                            return;
                        }

                        handler.config = jsonData;
                        toLoad--;

                        if (toLoad == 0) {
                            callback();
                        }

                    });

                });

            };

        this.apps = [];
        this.logger = logger;

        for (key in config) {
            entry = config[key];
            handler = new AppHandler(entry, directories.app, directories.root, logger);
            this.apps.push(handler);
            toLoad++;
            loadConfig(handler);
        }

    }

};

