'use strict';

var REG_LISTENER = /^([a-z]+[A-Za-z]+)Listener$/;

module.exports = class WebsocketAPI {

    constructor(server) {

        var key = '',
            listenerKey = '',
            m = null,
            prop = null;

        this.server = server;
        this.listeners = {};

        for (key in this) {

            prop = this[key];

            if (typeof prop == 'function'
                    && (m = prop.match(REG_LISTENER))) {

                listenerKey = m.pop();
                listenerKey = listenerKey.replace(/[A-Z]/g, (x) => { return '-' + x.toLowerCase(); });
                this.listeners[listenerKey] = this.listeners[listenerKey] || [];
                this.listeners[listenerKey].push(this[prop].bind(this));

            }

        }

    }

    process(client, data) {

    }

};

