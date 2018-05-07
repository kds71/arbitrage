'use strict';

var uniqid = require('lib/uniqid');

module.exports = class WebsocketClient {

    constructor(socket) {

        this.id = uniqid();
        this.socket = socket;
        this.currentPath = '';
        this.login = '';
        this.authorized = false;
    
    }

    getInfo() {

        return {
            id: this.id,
            addr: this.socket.remoteAddr,
            name: this.login
        }

    }

    send(data) {

        if (!('timestamp' in data)) {
            data.timestamp = Date.now();
        }

        this.socket.send(JSON.stringify(data));

    }

    authorize(data) {

        this.login = data.login;
        this.authorized = true;

    }

};

