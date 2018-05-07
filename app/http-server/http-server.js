'use strict';

var express = require('express'),
    expressWebsocket = require('express-ws');

var C = require('lib/constants'),
    Application = require('lib/application'),
    WebsocketClient = require('./websocket-client');

module.exports = class HTTPServer extends Application {

    constructor() {

        super();

        this.expressApp = null;
        this.websocket = null;
        this.clients = {};

    }

    start() {

        this.expressApp = express();

        this.expressApp.use(express.static(this.config.directories.www, {
            index: 'index.htm',
            redirect: false
        }));

        this.websocket = expressWebsocket(this.expressApp);
        this.expressApp.ws('/websocket', function(socket) {
            socket.on('message', this.websocketMessageHandler.bind(this, socket));
            socket.on('close', this.websocketCloseHandler.bind(this, socket));
        }.bind(this));

        this.expressApp.use('/constants', function(req, res) {

            var content = JSON.stringify(C),
                size = Buffer.byteLength(content, 'utf8');

            res.set({
                'Content-Length': size,
                'Content-Type': C.MIME_JSON
            });

            res.end(JSON.stringify(C));

        });

        this.expressApp.listen(this.config.port);

    }

    websocketMessageHandler(socket, reqstr) {
    
        var data = null,
            client = null,
            nclient = null;

        try {
            data = JSON.parse(reqstr);
        } catch (parseError) {

            this.logger.warn({ message: C.LOG_MESSAGE_WEBSOCKET_MALFORMED_JSON_FROM_CLIENT, client: { id: '', addr: socket._socket.remoteAddr, name: '' }});
            this.sendWebsocketError(socket, { message: C.WS_ERROR_MALFORMED_JSON, error: parseError });
            return;
        }

        if ('id' in data) {
            client = this.getClient(data.id);
            if (!client) {
                this.logger.warn({ message: C.LOG_MESSAGE_WEBSOCKET_UNKNOWN_CLIENT, client: { id: '', addr: socket._socket.remoteAddr, name: '' }});
                this.sendWebsocketError(socket, { message: C.WS_ERROR_UNKNOWN_CLIENT });
                return;
            }
        }

        if (data.message == C.WS_INFO_HANDSHAKE) {

            if (client) {
                client.send(false, { message: C.WS_ERROR_HANDSHAKRE_REPEAT });
                return;
            }

            client = new WebsocketClient(socket);
            this.clients[client.id] = client;
            client.send(true, { message: C.WS_INFO_HANDSHAKE, id: client.id });

            this.logger.info({ message: C.LOG_MESSAGE_WEBSOCKET_CLIENT_CONNECTED, client: client.getInfo() });

            return;
        }

    }

    websocketCloseHandler(socket) {

        var id = '',
            fid = '';
        
        for (id in this.clients) {
            if (this.clients[id].socket == socket) {
                fid = id;
                break;
            }
        }
        
        if (fid) {
            this.logger.info({ message: C.LOG_MESSAGE_WEBSOCKET_CLIENT_DISCONNECTED, client: this.clients[fid].getInfo() });
            delete this.clients[fid];
        }

    }

    sendWebsocketError(socket, data) {

        if (!('timestamp' in data)) {
            data.timestamp = Date.now();
        }

        socket.send(JSON.stringify(data));

    }

}

