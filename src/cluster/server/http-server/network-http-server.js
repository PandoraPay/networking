const https = require('https');
const http = require('http');

const cluster = require('cluster');
const sticky = require('sticky-session');

import NetworkHttpServerRouter from "./network-http-server-router"
import HttpServerHelper from "./http-server-helper"

const {Helper} = global.kernel.helpers;
const {HttpServer} = global.kernel.masterCluster;

/**
 * scope:
 *          argv, logger, HttpServerRouter, SocketServer, SocketServerRouter
 */

export default class NetworkHttpServer extends HttpServer {

    constructor( scope ){

        super(scope);

        this._scope = {
            ...scope,
            HttpServerRouter: NetworkHttpServerRouter,
        };

        this.httpServerRouter = new this._scope.HttpServerRouter({
            ...this._scope,
            socket: this,
            socketType: "httpServer",
        });

        this.address = "";

    }

    async _started(){

        let server, serverInstance, started;

        if (this._scope.argv.masterCluster.serverCluster.httpServer.sslUse) {

            serverInstance = await this._getHttpsServer();

             if (serverInstance)
                started = await this._startServer( serverInstance.server, true);

             if (started)
                 server = serverInstance.server;

        }

        if (!started) {

            serverInstance = await this._getHttpServer();

            if (serverInstance)
                started = await this._startServer( serverInstance.server, false);

            if (started)
                server = serverInstance.server;

        }

        if (started) {

            this.server = server;
            this.address = this._calculateAddress(
                serverInstance.ssl,
                serverInstance.ssl ? serverInstance.address : serverInstance.server.address() ? serverInstance.server.address().address : undefined,
                serverInstance.protocol,
                serverInstance.server.address() ? serverInstance.server.address().port : undefined
            );
            this.started = true;
        }

        return started;

    }



    async _getHttpsServer(){

        try {

            let options;
            try {

                options = HttpServerHelper.getCertificate();
                if (!options)
                    throw "no certificate";

            } catch (err){

                if (!this._scope.argv.masterCluster.serverCluster.httpServer.address)
                    throw "SSL domain was not specified";

                options = await HttpServerHelper.createCertificate( this._scope.argv.masterCluster.serverCluster.httpServer.address );

            }

            const server = https.createServer(options, this._express);

            return {
                ssl: true,
                server: server,
            };

        } catch (err){

            this._scope.logger.error("Http", "Https raised an error", err);
            return undefined;

        }

    }

    _getHttpServer(){

        try{

            const server = http.createServer(this._express);

            return {
                ssl: false,
                server: server,
            };

        } catch (err){
            this._scope.logger.error("Http", "Http raised an error", err);
            return undefined;

        }

    }

    _setRoutes(){

        if ( this.httpServerRouter ) {

            this.httpServerRouter.initRoutes(this._express, this._express.get.bind(this._express), undefined, undefined, '/', 'http-server');
            this.httpServerRouter.initRoutes(this._express, this._express.post.bind(this._express), undefined, undefined, '/', 'http-server');
        }

    }

    async _closed(){

        if (this.server)
            await this.server.close();

    }

    _calculateAddress( ssl , address = "::", protocol = this._scope.argv.masterCluster.serverCluster.serverSocket.protocol, port = this._scope.argv.masterCluster.serverCluster.httpServer.port ){
        return `${protocol}${ssl ? 's' : ''}://${address}:${port}`;
    }

    broadcast(name, data, senderSockets = {}){

        //propagate to two ways callbacks
        return 0;

    }

}

