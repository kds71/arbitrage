'use strict';

var AppHandler = require('./app-handler');

module.exports = class AppManager {

    construct(config, directories) {

        var key = '',
            entry = null,
            handler = null;

        this.apps = [];

        for (key in config) {
            entry = config[key];
            handler = new AppHandler(entry, directories.app);
        }

    }

};

