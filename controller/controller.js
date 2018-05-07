'use strict';

var path = require('path');

var C = require('../lib/constants'),
    AppManager = require('./app-manager');

module.exports = class Controller {

    constructor(config) {

        this.config = config;

        var dir = config.directories;

        this.directories = {
            root: dir.root,
            app: path.join(dir.root, dir.app),
            log: path.join(dir.root, dir.log),
            lib: path.join(dir.root, dir.lib),
            config: path.join(dir.root, dir.config)
        };

        this.appManager = new AppManager(config.applications, this.directories);

    }

};

