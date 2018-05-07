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

            console.log('spawn app', options);
            this.process = cp = spawn('node', ['.'], options);

            this.on('close', this.closeHandler.bind(this));
            this.on('error', this.errorHandler.bind(this));
            this.on('message', this.messageHandler.bind(this));
            this.stderr.on('data', this.stderrHandler.bind(this));
            this.stdout.on('data', this.stdoutHandler.bind(this));

        }

    }

    closeHandler() {

        this.state = C.APPLICATION_STATE_STOPPED;
        this.connected = false;
        this.emit(C.EVENT_APPLICATION_CLOSED, { app: this });

    }

    errorHandler(error) {

        this.state = C.APPLICATION_STATE_STOPPED;
        this.connected = false;
        this.emit(C.EVENT_APPLICATION_ERROR, { app: this, error: error });

    }

    messageHandler(data) {

        if (data.message == C.MESSAGE_HANDSHAKE) {

            if (!this.connectionState) {
                this.connected = true;
                this.process.send({ message: C.MESSAGE_UPDATE_CONFIG, config: config });
            }

        } else if (this.connected) {

            if (this.connected) {

                if (data.message == C.MESSAGE_APPLICATION_STARTED) {
                    this.state = C.APPLICATION_STATE_RUNNING;
                    this.emit(C.EVENT_APPLICATION_STARTED, { app: this });
                } else {
                    this.emit(C.EVENT_APPLICATION_MESSAGE, { app: this, data: data });
                }

            }

        }

    }

    stderrHandler(data) {

        this.emit(C.EVENT_APPLICATION_STDERR, { app: this, data: data.toString('utf8') });

    }

    stdoutHandler(data) {

        this.emit(C.EVENT_APPLICATION_STDOUT, { app: this, data: data.toString('utf8') });

    }

};

