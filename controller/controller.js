'use strict';

var path = require('path');

var C = require('../lib/constants'),
    Logger = require('../lib/logger'),
    uniqid = require('../lib/uniqid'),
    AppManager = require('./app-manager');

module.exports = class Controller {

    constructor(config) {

        this.id = uniqid();
        this.config = config;
        this.debug = !!config['debug-mode'];
        this.stopping = false;

        process.on('SIGINT', this.sigintHandler.bind(this));

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

        this.logger.info({ message: C.LOG_MESSAGE_APPLICATION_STARTED, id: this.id, name: 'controller' });

        this.appManager = new AppManager(this, this.appManagerStartHandler.bind(this));

    }

    fatalError(message, error) {

        this.logger.fatal({ message: C.LOG_MESSAGE_APPLICATION_STARTUP_FAILED, error: error, id: this.id, name: 'controller' });
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

    sigintHandler() {

        if (!this.stopping) {

            this.stopping = true;

            console.log('\nSHUT DOWN REQUESTED BY USER\n');
            this.logger.warn({ message: C.LOG_MESSAGE_APPLICATION_CONTROLLER_STOPPED_BY_USER, id: this.id, name: 'controller' });

            this.appManager.stop(function() {
                this.logger.stop(() => {
                    console.log('\nSHUT DOWN COMPLETED\n');
                    process.exit(0);
                });
            }.bind(this));

        }

    }

};

