'use strict';

var path = require('path'),
    spawn = require('child_process').spawn,
    EventEmitter = require('events').EventEmitter;

var uniqid = require('../lib/uniqid'),
    C = require('../lib/constants');

module.exports = class AppHandler extends EventEmitter {

    constructor(descriptor, directories) {

        super();

        this.name = descriptor.name;
        this.id = uniqid();
        this.persistent = descriptor.persistent;
        this.autostart = descriptor.autostart;
        this.dir = path.join(directories.app, descriptor.dir);
        this.root = directories.root;
        this.process = null;
        this.state = C.APPLICATION_STATE_CLOSED;
        this.connected = false;
        this.config = descriptor.config;

    }

    start() {

        var cp = null,
            env = process.env,
            options = null;

        if (this.state == C.APPLICATION_STATE_CLOSED) {

            this.state = C.APPLICATION_STATE_STARTING;

            env['NODE_PATH'] = this.root;

            options = {
                cwd: this.dir,
                stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
                env: env
            };

            this.process = cp = spawn('node', ['.', this.id, this.name], options);

            this.process.on('close', this.closeHandler.bind(this));
            this.process.on('error', this.errorHandler.bind(this));
            this.process.on('message', this.messageHandler.bind(this));
            this.process.stderr.on('data', this.stderrHandler.bind(this));
            this.process.stdout.on('data', this.stdoutHandler.bind(this));

        }

    }

    stop() {

        this.process.send({ message: C.REQUEST_APPLICATION_STOP });

    }

    closeHandler() {

        this.state = C.APPLICATION_STATE_CLOSED;
        this.connected = false;
        this.emit(C.EVENT_APPLICATION_CLOSED, this);

    }

    errorHandler(error) {

        this.state = C.APPLICATION_STATE_CLOSED;
        this.connected = false;
        this.emit(C.EVENT_APPLICATION_ERROR, this, error);

    }

    messageHandler(data) {

        if (data.message == C.INFO_HANDSHAKE) {

            if (!this.connected) {
                this.connected = true;
                this.process.send({ message: C.REQUEST_UPDATE_CONFIG, config: this.config });
            }

        } else if (this.connected) {

            if (this.connected) {

                if (data.message == C.INFO_APPLICATION_STARTED) {
                    this.state = C.APPLICATION_STATE_RUNNING;
                    this.emit(C.EVENT_APPLICATION_STARTED, this);
                } else {
                    this.emit(C.EVENT_APPLICATION_MESSAGE, this, data);
                }

            }

        }

    }

    stderrHandler(data) {

        this.emit(C.EVENT_APPLICATION_STDERR, this, data.toString('utf8'));

    }

    stdoutHandler(data) {

        this.emit(C.EVENT_APPLICATION_STDOUT, this, data.toString('utf8'));

    }

};

