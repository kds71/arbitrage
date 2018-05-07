'use strict';

var AppHandler = require('./app-handler');

module.exports = class AppManager {

    construct(config, directories, logger) {

        var key = '',
            entry = null,
            handler = null,
            i = 0;

        this.apps = [];
        this.logger = logger;

        for (key in config) {
            entry = config[key];
            handler = new AppHandler(entry, directories.app, directories.root, logger);
            this.apps.push(handler);
        }

        for (i = 0; i < this.apps.length; i++) {
            handler = this.apps[i];
            if (handler.autostart) {
                handler.start();
            }
        }

    }

};

