'use strict';

var path = require('path'),
    spawn = require('child_process').spawn();

var uniqid = require('../lib/uniqid'),
    C = require('../lib/constants');

module.exports = class AppHandler {

    constructor(config, basedir, rootdir, logger) {

        this.name = config.name;
        this.id = uniqid();
        this.persistent = config.persistent;
        this.autostart = config.autostart;
        this.dir = path.join(basedir, config.dir);
        this.root = rootdir;
        this.process = null;
        this.state = C.APPLICATION_STATE_CLOSED;
        this.connectionState = C.APPLICATION_CONNECTION_NONE;
        this.logger = logger;

    }

    start() {

        var cp = null,
            env = process.env,
            options = null;

        if (this.state == C.APPLICATION_STATE_STOPPED) {

            this.state = C.APPLICATION_STATE_STARTING;

            env['NODE_PATH'] = this.root;

            options = {
                cwd: this.dir,
                stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
                env: env
            };

            this.process = cp = spawn('node', ['.'], options);

            this.on('close', this.closeHandler.bind(this));
            this.on('error', this.errorHandler.bind(this));
            this.on('message', this.messageHandler.bind(this));
            this.stderr.on('data', this.stderrHandler.bind(this));
            this.stdout.on('data', this.stdoutHandler.bind(this));

        }

    }

    closeHandler() {

        

    }

    errorHandler() {
    }

    messageHandler() {
    }

    stderrHandler() {
    }

    stdoutHandler() {
    }

};

