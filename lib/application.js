'use strict';

var C = require('lib/constants'),
    Logger = require('lib/logger'),
    FakeLogger = require('lib/fake-logger');

module.exports = class Application {

    constructor() {

        var argv = process.argv.slice(2);

        this.config = null;
        this.stopping = false;
        this.state = C.APPLICATION_STATE_STARTING;
        this.logger = new FakeLogger();
        this.id = argv[0];
        this.name = argv[1];

        process.on('message', this.messageHandler.bind(this));
        process.on('SIGINT', () => {});

        this.send(C.INFO_HANDSHAKE);

    }

    configUpdated(config) {

        if (this.state == C.APPLICATION_STATE_STARTING) {

            this.config = config;
            this.state = C.APPLICATION_STATE_RUNNING;
            this.send(C.INFO_APPLICATION_STARTED);

            if ('logger' in config) {
                this.logger = new Logger(config.logger);
                this.logger.info({ message: C.LOG_MESSAGE_APPLICATION_STARTED });
            }
            
            this.start();

        } else if (this.state == C.APPLICATION_STATE_RUNNING) {

            this.configUpdatedHandler(config, function() {
                this.send(C.INFO_CONFIG_UPDATED);
            }.bind(this));

        }

    }
    
    configUpdatedHandler(config, callback) {

        this.config = config;
        process.nextTick(callback);

    }

    /**
     * @abstract
     */
    start() {}
    
    stop() {

        if (this.state == C.APPLICATION_STATE_RUNNING) {

            this.state = C.APPLICATION_STATE_STOPPING;

            if (this.logger) {
                this.logger.info({ message: C.LOG_MESSAGE_APPLICATION_STOP_REQUESTED_BY_CONTROLLER, id: this.id });
                this.logger.stop(() => {
                    process.exit(0);   
                });
            } else {
                process.exit(0);
            }

        }

    }

    send(message, data) {

        var sdata = data || {};
        sdata.message = message;
        sdata.timestamp = Date.now();

        process.send(sdata);

    }

    messageHandler(data) {

        if (data.message == C.REQUEST_UPDATE_CONFIG) {
            this.configUpdated(data.config);
        } else if (data.message == C.REQUEST_APPLICATION_STOP) {
            this.stopping = true;
            this.stop();
        }

    }

};


