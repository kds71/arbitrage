'use strict';

var path = require('path');

var uniqid = require('../lib/uniqid'),
    C = require('../lib/constants');

module.exports = class AppHandler {

    constructor(config, basedir) {

        this.name = config.name;
        this.id = uniqid();
        this.persistent = config.persistent;
        this.autostart = config.autostart;
        this.dir = path.join(basedir, config.dir);
        this.process = null;
        this.state = C.APPLICATION_STATE_CLOSED;

    }

};

