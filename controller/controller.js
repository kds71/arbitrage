'use strict';

var path = require('path');

var C = require('../lib/constants'),
    Logger = require('../lib/logger'),
    AppManager = require('./app-manager');

module.exports = class Controller {

    constructor(config) {

        this.config = config;
        this.debug = !!config['debug-mode'];

        var dir = config.directories;

        this.directories = {
            root: dir.root,
            app: path.join(dir.root, dir.app),
            log: path.join(dir.root, dir.log),
            lib: path.join(dir.root, dir.lib),
            config: path.join(dir.root, dir.config)
        };

        this.logger = new Logger({
            level: this.debug ? C.LOG_LEVEL_VERBOSE : C.LOG_LEVEL_INFO,
            'app-name': 'controller',
            'rotate-hourly': true,
            directory: this.directories.log
        });

        this.appManager = new AppManager(this, this.appManagerStartHandler.bind(this));

    }

    appManagerStartHandler(error) {

        if (error) {
            logger.fatal({ type: C.LOG_MESSAGE_APPLICATION_STARTUP_FAILED, error: error });
            logger.stop(() => {
                process.exit(0);
            });
        }

    }

};

