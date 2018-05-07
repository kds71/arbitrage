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

        this.logger.info({ message: C.LOG_MESSAGE_APPLICATION_STARTED, id: '0', name: 'controller' });

        this.appManager = new AppManager(this, this.appManagerStartHandler.bind(this));

    }

    fatalError(message, error) {

        this.logger.fatal({ type: C.LOG_MESSAGE_APPLICATION_STARTUP_FAILED, error: error });
        this.logger.stop(() => {
            console.log('\nCONTROLLER STOPPED AFTER FATAL ERROR\nCheck log file for details\n');
            process.exit(0);
        });

    }

    appManagerStartHandler(error) {

        if (error) {
            this.fatalError(C.LOG_MESSAGE_APPLICATION_STARTUP_FAILED, error);
            return;
        }

        this.appManager.start();

    }

};

