'use strict';

var uniqid = require('lib/uniqid');

module.exports = class WebsocketClient {

    constructor(socket) {

        this.id = uniqid();
        this.socket = socket;
        this.currentPath = '';
        this.login = '';
    
    }

    getInfo() {

        return {
            id: this.id,
            addr: this.socket.remoteAddr,
            name: this.login
        }

    }

    send(success, data) {

        data.status = !!success;
        if (!('timestamp' in data)) {
            data.timestamp = Date.now();
        }

        this.socket.send(JSON.stringify(data));

    }

};

