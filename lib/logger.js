'use strict';

var path = require('path'),
    fs = require('fs'),
    moment = require('moment-timezone');

var C = require('./constants'),
    mkdirtree = require('./mkdirtree'),
    copyObj = require('./copy-object');

var levelOrder = [C.LOG_LEVEL_FATAL, C.LOG_LEVEL_ERROR, C.LOG_LEVEL_WARN, C.LOG_LEVEL_INFO, C.LOG_LEVEL_DEBUG, C.LOG_LEVEL_VERBOSE, C.LOG_LEVEL_SILLY];

module.exports = class Logger {

    constructor(config) {

        this.config = config;
        this.config['timezone'] = this.config['timezone'] || C.DEFAULT_TIMEZONE;
        this.queue = [];
        this.logfile = null;
        this.fileTimestamp = null;
        this.state = 'none';
        this.level = this.config['level'] || C.LOG_LEVEL_INFO;
        this.levelIndex = levelOrder.indexOf(this.level);
        this.endCallback = null;

    }

    setLevel(level) {

        this.level = level;
        this.levelIndex = levelOrder.indexOf(this.level);

    }

    timestamp(ms) {

        var m = ms ? moment.tz(ms, this.config['timezone']) : moment.tz(this.config['timezone']);

        return {
            date: m.format('YYYY-MM-DD'),
            full: m.format('HH:mm:ss.SSS'),
            file: m.format('HH') + '.log'
        };

    }

    createLogFile() {
    
        var timestamp = this.timestamp(),
            basedir = path.join(this.config['directory'], this.config['app-name'], timestamp.date),
            filename = path.join(basedir, timestamp.file);
    
        mkdirtree(basedir, function(error) {
    
            if (error) {
                return;
            }
    
            this.fileTimestamp = timestamp;
    
            this.logfile = fs.createWriteStream(filename, { encoding: 'utf8', flags: 'a' });
    
            this.logfile.on('error', function() {
    
                this.state = 'none';
    
            }.bind(this));
    
            this.logfile.on('open', function() {
                this.state = 'ready';
                this.writeQueue();
            }.bind(this));
    
        }.bind(this));
    
    }

    writeDirect(str) {
    
        this.logfile.write(str);
    
        if (!this.queue.length && this.endCallback) {
            this.logfile.on('finish', function() {
                this.endCallback();
            }.bind(this));
            this.logfile.end();
        }
    
    }

    writeQueue() {
    
        var str = '';
    
        if (!this.queue.length) {
            return;
        }
    
        str = this.queue.join('');
        this.queue = [];
    
        this.writeDirect(str);
    
    }

    write(msg) {
    
        var now = Date.now(),
            timestamp = this.timestamp(now),
            msgstr = '';
    
        msg.timestamp = now;
        msg.date = timestamp.date + ' ' + timestamp.full;
        msgstr = JSON.stringify(msg) + '\n';
    
        switch (this.state) {
    
        case 'none':
    
            this.state = 'create-file';
            this.queue.push(msgstr);
            this.createLogFile();
            break;
    
        case 'create-file':
    
            this.queue.push(msgstr);
            break;
    
        case 'ready':
    
            if (this.config['rotate-hourly'] === true 
                    && (timestamp.date != this.fileTimestamp.date || timestamp.file != this.fileTimestamp.file)) {
    
                this.logfile.end();
                this.state = 'create-file';
                this.queue.push(msgstr);
                this.createLogFile();
    
            } else {
    
                this.writeDirect(msgstr);
    
            }
    
            break;
    
        }
    
    }

    log(level, message) {
    
        var levelIndex = levelOrder.indexOf(level),
            msgjson = {
                level: level
            };
    
        if (levelIndex > this.levelIndex) {
            return;
        }
    
        if (typeof message == 'string') {
            msgjson.message = message;
        } else {
            copyObj(message, msgjson);
        }
    
        this.write(msgjson);
    
    }

    stop(callback) {
    
        this.endCallback = callback;
    
        if (this.state == 'ready' || !this.queue.length) {
            if (this.logfile) {
                this.logfile.on('finish', function() {
                    this.endCallback();
                }.bind(this));
                this.logfile.end();
            } else {
                this.endCallback();
            }
        }
    
    }

    fatal(message) {
        this.log(C.LOG_LEVEL_FATAL, message);
    }

    error(message) {
        this.log(C.LOG_LEVEL_ERROR, message);
    }
    
    warn(message) {
        this.log(C.LOG_LEVEL_WARN, message);
    }
    
    info(message) {
        this.log(C.LOG_LEVEL_INFO, message);
    }
    
    debug(message) {
        this.log(C.LOG_LEVEL_DEBUG, message);
    }
    
    silly(message) {
        this.log(C.LOG_LEVEL_SILLY, message);
    }

};

