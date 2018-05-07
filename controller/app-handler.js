'use strict';

var uniqid = require('../lib/uniqid');

module.exports = class AppHandler {

    constructor(config) {

        this.name = config.name;
        this.id = uniqid();
        this.persistent = config.persistent;
        this.autostart = config.autostart;

    }

};

