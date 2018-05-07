'use strict';

var Arb = Arb || {};

var signed = function(l) {
        l[1].signature = l[0];
        return l[1];
    };

Arb.Websocket = {
 
    init: function() {

        var prop = '';

        Arb.Websocket.listeners = {};
        Arb.Websocket.connected = false;

        Arb.Websocket.ws = new WebSocket('ws://' + document.location.hostname + ':' + document.location.port + '/websocket', 'appcontroller-protocol');
        Arb.Websocket.ws.onmessage = Arb.Websocket.messageHandler;
        Arb.Websocket.ws.onopen = Arb.Websocket.openHandler;
        Arb.Websocket.ws.onclose = Arb.Websocket.closeHandler;

        for (prop in Arb.Websocket) {

            if (typeof Arb.Websocket[prop] == 'function'
                    && Arb.Websocket[prop]
                    && Arb.Websocket[prop].signature
                    && Arb.Websocket[prop].signature.message) {
                
                Arb.Websocket.listeners[Arb.Websocket[prop].signature.message] = Arb.Websocket.listeners[Arb.Websocket[prop].signature.message] || [];
                Arb.Websocket.listeners[Arb.Websocket[prop].signature.message].push(Arb.Websocket[prop]);
            }
        }

    },

    messageHandler: function(event) {

        var data = null,
            i = 0,
            ary = null;

        try {
            data = JSON.parse(event.data);
        } catch (parseError) {
            // TODO
            Arb.fatalError();
            return;
        }

        console.log(data);

        if (!('message' in data)) {
            // TODO
            Arb.fatalError();
            return;
        }

        if (!(data.message in Arb.Websocket.listeners)) {
            // TODO
            Arb.fatalError();
            return;
        }

        ary = Arb.Websocket.listeners[data.message];

        if (!ary.length) {
            // TODO
            Arb.fatalError();
            return;
        }

        for (i = 0; i < ary.length; i++) {
            ary[i](data);
        }

    },

    openHandler: function() {

        Arb.Websocket.connected = true;
        Arb.Websocket.send({ message: C.WS_INFO_HANDSHAKE });

    },

    closeHandler: function() {
    },

    send: function(data) {

        if (!('timestamp' in data)) {
            data.timestamp = Date.now();
        }

        if (Arb.id) {
            data.id = Arb.id;
        }

        Arb.Websocket.ws.send(JSON.stringify(data));

    },

    handshakeListener: signed([

        { message: C.WS_INFO_HANDSHAKE },

        function(data) {
            Arb.id = data.id;
            Arb.release();
        }

    ])

};

