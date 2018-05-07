'use strict';

var path = require('path');

var C = require('../lib/constants'),
    Logger = require('../lib/logger'),
    AppManager = require('./app-manager');

module.exports = class Controller {

    constructor(config) {

        this.config = config;

        var dir = config.directories;

        this.directories = {
            root: dir.root,
            app: path.join(dir.root, dir.app),
            log: path.join(dir.root, dir.log),
            lib: path.join(dir.root, dir.lib),
            config: path.join(dir.root, dir.config)
        };

        this.logger = new Logger({
            level: config['debug-mode'] ? C.LOG_LEVEL_VERBOSE : C.LOG_LEVEL_INFO,
            'app-name': 'controller',
            'rotate-hourly': true,
            directory: this.directories.log
        });

        this.appManager = new AppManager(config.applications, this.directories, this.logger);

    }

};

