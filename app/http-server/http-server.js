'use strict';

var express = require('express'),
    expressWebsocket = require('express-ws'),
    fs = require('fs'),
    path = require('path');

var C = require('lib/constants'),
    Application = require('lib/application'),
    WebsocketClient = require('./websocket-client'),
    WebsocketAPI = require('./websocket-api');

module.exports = class HTTPServer extends Application {

    constructor() {

        super();

        this.expressApp = null;
        this.websocket = null;
        this.clients = {};
        this.directories = {};
        this.cache = {
            moduleMeta: {},
            moduleTemplate: {},
            moduleScript: {}
        };

    }

    start() {

        this.expressApp = express();
        this.directories.www = this.config.directories.www;
        this.directories.module = path.join(this.directories.www, this.config.directories.module);

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
                'Content-Type': C.MIME_JSON + '; charset=utf-8'
            });

            res.end(JSON.stringify(C));

        });

        this.websocketAPI = new WebsocketAPI(this);

        this.expressApp.use('/module/:id/:name/meta', this.getModuleMeta.bind(this));
        this.expressApp.use('/module/:id/:name/template/:templateName', this.getModuleTemplate.bind(this));
        this.expressApp.use('/module/:id/:name/script/:scriptName', this.getModuleScript.bind(this));

        this.expressApp.listen(this.config.port);

    }

    websocketMessageHandler(socket, reqstr) {
    
        var data = null,
            client = null,
            nclient = null;

        try {
            data = JSON.parse(reqstr);
        } catch (parseError) {

            this.logger.warn({ message: C.LOG_MESSAGE_WEBSOCKET_MALFORMED_JSON_FROM_CLIENT, client: { id: '', addr: socket.remoteAddr, name: '' }});
            this.sendWebsocketError(socket, { message: C.WS_ERROR_MALFORMED_JSON, error: parseError });
            return;
        }

        if ('id' in data) {
            client = this.clients[data.id];
            if (!client) {
                this.logger.warn({ message: C.LOG_MESSAGE_WEBSOCKET_UNKNOWN_CLIENT, client: { id: '', addr: socket.remoteAddr, name: '' }});
                this.sendWebsocketError(socket, { message: C.WS_ERROR_UNKNOWN_CLIENT });
                return;
            }
        }

        if (data.message == C.WS_INFO_HANDSHAKE) {

            if (client) {
                client.send({ message: C.WS_ERROR_HANDSHAKRE_REPEAT });
                return;
            }

            client = new WebsocketClient(socket);
            this.clients[client.id] = client;
            client.send({ message: C.WS_INFO_HANDSHAKE, id: client.id });

            this.logger.info({ message: C.LOG_MESSAGE_WEBSOCKET_CLIENT_CONNECTED, client: client.getInfo() });

            return;
        }

        if (!client) {
            this.logger.warn({ message: C.LOG_MESSAGE_WEBSOCKET_UNKNOWN_CLIENT, client: { id: '', addr: socket.remoteAddr, name: '' }});
            this.sendWebsocketError(socket, { message: C.WS_ERROR_UNKNOWN_CLIENT });
            return;
        }

        if (data.message == C.WS_REQUEST_LOGIN) {

            if (client.authorized) {
                this.logger.warn({ message: C.LOG_MESSAGE_WEBSOCKET_AUTHORIZED_USER_LOGIN_ATTEMPT, client: client.getInfo() });
                client.send({ message: C.WS_ERROR_LOGIN_REPEAT });
                return;
            }

            if (this.checkLoginCredentials(data)) {
                client.authorize(data);
                this.logger.info({ message: C.LOG_MESSAGE_WEBSOCKET_USER_AUTHORIZED, client: client.getInfo() });
                client.send({ message: C.WS_INFO_LOGIN_SUCCESS });
                return;
            }

            this.logger.info({ message: C.LOG_MESSAGE_WEBSOCKET_USER_AUTHORIZATION_FAILED, client: client.getInfo() });
            client.send({ message: C.WS_ERROR_LOGIN_FAILED, fields: ['login',  'password'] });
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

    checkLoginCredentials(data) {

        var key = C.HTTP_SERVER_CREDENTIALS.replace(/-/g, '_').toUpperCase(),
            credentials = process.env[key],
            reg = /^\(<(.*?)> <(.*?)>\) ?/,
            m = null,
            name = '',
            pass = '';

        while (m = credentials.match(reg)) {

            pass = m.pop();
            name = m.pop();

            if (data.login == name && data.password == pass) {
                return true;
            }

            credentials = credentials.replace(reg, '');

        }

        return false;

    }

    sendWebsocketError(socket, data) {

        if (!('timestamp' in data)) {
            data.timestamp = Date.now();
        }

        socket.send(JSON.stringify(data));

    }

    getModuleMeta(request, response) {

        var name = request.params.name,
            id = request.params.id,
            client = null,
            filename = '';

        if (!(id in this.clients)) {
            this.logger.warn({ message: C.LOG_MESSAGE_UNAUTHORIZED_MODULE_LOADING_ATTEMPT, client: { id: '', addr: request.ip, name: '' }});
            response.status(404).end();
            return;
        }

        client = this.clients[id];

        filename = path.join(this.directories.module, name, 'meta.json');

        if (name in this.cache.moduleMeta) {
            this.returnModuleMeta(request, response, client, this.cache.moduleMeta[name]);
            return;
        }

        fs.access(filename, fs.constants.R_OK, function(error) {
        
            if (error) {
                this.logger.warn({ message: C.LOG_MESSAGE_ACCESS_TO_INVALID_MODULE, client: client.getInfo(), module: name });
                response.status(404).end();
                return;
            }

            fs.readFile(filename, { encoding: 'utf8' }, function(error, content) {

                var data = null;

                if (error) {
                    this.logger.error({ message: C.LOG_MESSAGE_IO_ERROR, filename: filename, error: error });
                    response.status(500).end();
                    return;
                }
                
                try {
                    data = JSON.parse(content);
                } catch (parseError) {
                    this.logger.error({ message: C.LOG_MESSAGE_PARSE_ERROR, filename: filename, error: parseError });
                    response.status(500).end();
                    return;
                }

                this.cache.moduleMeta[name] = data;
                this.returnModuleMeta(request, response, client, this.cache.moduleMeta[name]);

            }.bind(this));

        }.bind(this));

    }

    returnModuleMeta(request, response, client, data) {

        var content = '',
            size = 0;

        if (data.restricted && !client.authorized) {
            this.logger.warn({ message: C.LOG_MESSAGE_UNAUTHORIZED_MODULE_LOADING_ATTEMPT, client: client.getInfo() });
            response.status(404).end();
            return;
        }

        content = JSON.stringify(data);
        size = Buffer.byteLength(content, 'utf8');

        response.set({
            'Content-Length': size,
            'Content-Type': C.MIME_JSON + '; charset=utf-8'
        });

        response.end(content);

    }

    getModuleTemplate(request, response) {

        var name = request.params.name,
            id = request.params.id,
            templateName = request.params.templateName,
            meta = null,
            client = null,
            filename = '';

        if (!(id in this.clients)) {
            this.logger.warn({ message: C.LOG_MESSAGE_UNAUTHORIZED_MODULE_LOADING_ATTEMPT, client: { id: '', addr: request.ip, name: '' }});
            response.status(404).end();
            return;
        }

        client = this.clients[id];

        if (!(name in this.cache.moduleMeta)) {
            this.logger.warn({ message: C.LOG_MESSAGE_ACCESS_TO_INVALID_MODULE, client: client.getInfo(), module: name, template: templateName });
            response.status(404).end();
            return;
        }

        meta = this.cache.moduleMeta[name];

        if (!~(meta.templates.indexOf(templateName))) {
            this.logger.warn({ message: C.LOG_MESSAGE_ACCESS_TO_INVALID_MODULE, client: client.getInfo(), module: name, template: templateName });
            response.status(404).end();
            return;
        }

        if ((name + '/' + templateName) in this.cache.moduleTemplate) {
            this.returnModuleTemplate(request, response, client, meta, this.cache.moduleTemplate[name + '/' + templateName]);
            return;
        }

        filename = path.join(this.directories.module, name, templateName + '.htm');

        fs.access(filename, fs.constants.R_OK, function(error) {

            if (error) {
                this.logger.warn({ message: C.LOG_MESSAGE_ACCESS_TO_INVALID_MODULE, client: client.getInfo(), module: name, template: templateName });
                response.status(404).end();
                return;
            }

            fs.readFile(filename, { encoding: 'utf8' }, function(error, content) {

                if (error) {
                    this.logger.error({ message: C.LOG_MESSAGE_IO_ERROR, filename: filename, error: error });
                    response.status(500).end();
                    return;
                }

                this.cache.moduleTemplate[name + '/' + templateName] = content;
                this.returnModuleTemplate(request, response, client, meta, content);

            }.bind(this));

        }.bind(this));

    }

    returnModuleTemplate(request, response, client, meta, content) {

        var size = 0;

        if (meta.restricted && !client.authorized) {
            this.logger.warn({ message: C.LOG_MESSAGE_UNAUTHORIZED_MODULE_LOADING_ATTEMPT, client: client.getInfo() });
            response.status(404).end();
            return;
        }

        size = Buffer.byteLength(content, 'utf8');

        response.set({
            'Content-Length': size,
            'Content-Type': C.MIME_HTML + '; charset=utf-8'
        });

        response.end(content);

    }

    getModuleScript(request, response) {

        var name = request.params.name,
            id = request.params.id,
            scriptName = request.params.scriptName,
            meta = null,
            client = null,
            filename = '';

        if (!(id in this.clients)) {
            this.logger.warn({ message: C.LOG_MESSAGE_UNAUTHORIZED_MODULE_LOADING_ATTEMPT, client: { id: '', addr: request.ip, name: '' }});
            response.status(404).end();
            return;
        }

        client = this.clients[id];

        if (!(name in this.cache.moduleMeta)) {
            this.logger.warn({ message: C.LOG_MESSAGE_ACCESS_TO_INVALID_MODULE, client: client.getInfo(), module: name, script: scriptName });
            response.status(404).end();
            return;
        }

        meta = this.cache.moduleMeta[name];

        if (!~(meta.scripts.indexOf(scriptName))) {
            this.logger.warn({ message: C.LOG_MESSAGE_ACCESS_TO_INVALID_MODULE, client: client.getInfo(), module: name, script: scriptName });
            response.status(404).end();
            return;
        }

        if ((name + '/' + scriptName) in this.cache.moduleScript) {
            this.returnModuleScript(request, response, client, meta, this.cache.moduleScript[name + '/' + scriptName]);
            return;
        }

        filename = path.join(this.directories.module, name, scriptName + '.js');

        fs.access(filename, fs.constants.R_OK, function(error) {

            if (error) {
                this.logger.warn({ message: C.LOG_MESSAGE_ACCESS_TO_INVALID_MODULE, client: client.getInfo(), module: name, script: scriptName });
                response.status(404).end();
                return;
            }

            fs.readFile(filename, { encoding: 'utf8' }, function(error, content) {

                if (error) {
                    this.logger.error({ message: C.LOG_MESSAGE_IO_ERROR, filename: filename, error: error });
                    response.status(500).end();
                    return;
                }

                this.cache.moduleScript[name + '/' + scriptName] = content;
                this.returnModuleScript(request, response, client, meta, content);

            }.bind(this));

        }.bind(this));

    }

    returnModuleScript(request, response, client, meta, content) {

        var size = 0;

        if (meta.restricted && !client.authorized) {
            this.logger.warn({ message: C.LOG_MESSAGE_UNAUTHORIZED_MODULE_LOADING_ATTEMPT, client: client.getInfo() });
            response.status(404).end();
            return;
        }

        size = Buffer.byteLength(content, 'utf8');

        response.set({
            'Content-Length': size,
            'Content-Type': C.MIME_JS + '; charset=utf-8'
        });

        response.end(content);

    }

}

