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
            addr: this.socket._socket.remoteAddr,
            name: this.login
        }

    }

};

