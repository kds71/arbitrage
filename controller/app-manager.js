'use strict';

var fs = require('fs'),
    path = require('path');

var AppHandler = require('./app-handler'),
    C = require('../lib/constants');

module.exports = class AppManager {

    constructor(controller, callback) {

        var key = '',
            entry = null,
            handler = null,
            toLoad = 0,
            i = 0,
            directories = controller.directories,
            
            loadConfig = function(handler) {

                var filename = path.join(directories.config, handler.name + '.json');

                fs.access(filename, fs.constants.R_OK | fs.constants.W_OK, (error) => {

                    if (error) {
                        callback(error);
                        return;
                    }

                    fs.readFile(filename, { encoding: 'utf8' }, (error, data) => {

                        if (error) {
                            callback(error);
                            return;
                        }

                        var jsonData = null;

                        try {
                            jsonData = JSON.parse(data);
                        } catch (error) {
                            callback(error);
                            return;
                        }

                        handler.config = jsonData;
                        toLoad--;

                        if (toLoad == 0) {
                            callback();
                        }

                    });

                });

            };

        this.controller = controller;
        this.apps = [];
        this.appIndex = {};
        this.stopping = false;

        for (key in this.controller.config.applications) {

            entry = this.controller.config.applications[key];

            handler = new AppHandler(entry, directories);
            handler.on(C.EVENT_APPLICATION_CLOSED, this.applicationClosedHandler.bind(this));
            handler.on(C.EVENT_APPLICATION_STARTED, this.applicationStartedHandler.bind(this));
            handler.on(C.EVENT_APPLICATION_ERROR, this.applicationErrorHandler.bind(this));
            handler.on(C.EVENT_APPLICATION_STDOUT, this.applicationSTDOUTHandler.bind(this));
            handler.on(C.EVENT_APPLICATION_STDERR, this.applicationSTDERRHandler.bind(this));
            handler.on(C.EVENT_APPLICATION_MESSAGE, this.applicationMessageHandler.bind(this));

            this.apps.push(handler);
            this.appIndex[handler.id] = this.apps.length - 1;
            toLoad++;

        }

        for (i = 0; i < this.apps.length; i++) {
            loadConfig(this.apps[i]);
        }

    }

    start() {

        var i = 0;
        for (i = 0; i < this.apps.length; i++) {
            if (this.apps[i].autostart) {
                this.apps[i].start();
            }
        }

    }

    stop(callback) {

        var app = null,
            needWait = false;

        this.stopping = true;
        this.endCallback = callback;

        for (i = 0; i < this.apps.length; i++) {

            app = this.apps[i];

            if (app.state != C.APPLICATION_STATE_CLOSED) {
                needWait = true;
            }
            
            if (app.state == C.APPLICATION_STATE_STARTED) {
                app.stop();
            }

        }

        if (!needWait) {
            process.nextTick(callback);
        }
        
    }

    applicationStartedHandler(app) {
    
        this.controller.logger.info({ message: C.LOG_MESSAGE_APPLICATION_STARTED, id: app.id, name: app.name });

        if (this.stopping) {
            app.stop();
        }

    }

    applicationShutdownHandler(app) {

        var i = 0,
            allClosed = true;

        if (this.stopping) {

            for (i = 0; i < this.apps.length; i++) {
                if (app.state != C.APPLICATION_STATE_CLOSED) {
                    allClosed = false;
                    break;
                }
            }

            if (allClosed && this.endCallback) {
                this.endCallback();
            }

        } else if (app.persistent) {
            setTimeout(app.start.bind(app), this.controller.config['application-restart-timeout']);
        }

    }

    applicationClosedHandler(app) {
     
        this.controller.logger.info({ message: C.LOG_MESSAGE_APPLICATION_STOPPED, id: app.id, name: app.name });
        this.applicationShutdownHandler(app);

    }
    
    applicationErrorHandler(app, error) {

        this.controller.logger.error({ message: C.LOG_MESSAGE_APPLICATION_ERROR, id: app.id, name: app.name, error: error });
        this.applicationShutdownHandler(app);

    }

    applicationSTDOUTHandler(app, data) {

        this.controller.logger.error({ message: C.LOG_MESSAGE_APPLICATION_STDERR, id: app.id, name: app.name, content: data });
        if (this.controller.debug) {
            console.log('\nAPPLICATION %s (%s) STDERR\n', app.name, app.id);
            console.log(data);
        }

    }

    applicationSTDERRHandler(app, data) {

        if (this.controller.debug) {
            console.log('\nAPPLICATION %s (%s) STDOUT\n', app.name, app.id);
            console.log(data);
        }

    }

    applicationMessageHandler(app, data) {
    }

};

