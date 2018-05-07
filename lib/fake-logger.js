'use strict';

module.exports = class FakeLogger {

    setLevel(level) {}
    log(level, message) {}

    fatal(message) {}
    error(message) {}
    warn(message) {}
    info(message) {}
    debug(message) {}
    silly(message) {}

    stop(callback) {
        process.nextTick(callback);
    }

};

