import ConnectedNodeSchema from "../../clients/pending-clients/schemas/connected-node-schema";

const server = require('socket.io');

import NetworkServerClientSocket from "./client/network-server-client-socket"
import NetworkServerClientSocketRouter from "./client/network-server-client-socket-router"
import NodeConnectionTypeEnum from "../../schemas/types/node-connection-type-enum";
import NodeConsensusTypeEnum from "src/cluster/schemas/types/node-consensus-type-enum"

const {Exception } = global.kernel.helpers;
const {Helper} = global.kernel.helpers;

/**
 * scope
 *          argv, logger, db, masterCluster, httpServer, httpServerClass
 */

export default class NetworkServerSocket extends server {

    constructor(scope){

        super();

        this._scope = scope = {
            ServerClientSocket: NetworkServerClientSocket,
            ServerClientSocketRouter: NetworkServerClientSocketRouter,
            ...scope,
        };

        if ( !this._scope.httpServer )
            throw new Exception( this, "HttpServer was not specified");

        /**
         * list of all sockets
         */
        this.list = {};
        this.listCount = 0;

        /**
         * list of all sockets based on IP only to keep track of number of connected server sockets
         */
        this._uniqueList = {};

        this._startedStatus = false;

    }


    start(){

        if (this._startedStatus) return true;

        this._started();

        this._startedStatus = true;
    }

    _started(){
        try {
            this.listen(this._scope.httpServer.server);
        } catch (err){
            this._scope.logger.error("SocketServer", "Raised an error listening", {httpServer: this._scope.httpServer, error: err});
            return false;
        }
        this._initSocketServer();
    }

    close(){

        if (!this._startedStatus) return true;

        this._closed();

        this.emit("closed");
        this._startedStatus = false;
    }

    _closed(){
        for (const key in this.list)
            this.list[key].disconnect();
    }

    _initSocketServer(){

        this._serverClientSocketRouter = new this._scope.ServerClientSocketRouter({
            ...this._scope,
            socketType: "serverSocket",
        });

        /**
         * A new client socket was connected to the Socket.io Server
         */
        this.on("connection", clientSocket => this._acceptSocket(clientSocket) );

    }

    async _acceptSocket(socket){

        let address, addressUnique, newServerClientSocket;

        this._scope.logger.log(this, "_acceptSocket");

        try {

            if ( this.listCount > this._scope.argv.masterCluster.serverCluster.serverSocket.maximumConnections )
                throw new Exception(this, "maximum connections has exceeded");

            const handshake = this._serverClientSocketRouter.handshakeValidate( JSON.parse( socket.handshake.query.handshake ), socket.request.connection.remoteAddress );
            if (!handshake) throw new Exception(this,"handshake invalid");

            newServerClientSocket = new NetworkServerClientSocket({
                ...this._scope,
                socketServer: this,
                serverClientSocketRouter: this._serverClientSocketRouter,
            }, undefined, socket, handshake);
            newServerClientSocket.socketInitialized();

            /**
             * checking if there is a duplicate connection
             */
            address = newServerClientSocket.address.toString( true, true, true );
            if (this.list[address]) {
                address = "";
                throw new Exception(this, "socket server already connected");
            }

            this.list[address] = newServerClientSocket;
            this.listCount++;

            /**
             * check address unique
             */
            addressUnique = newServerClientSocket.address.toString( false, false, false );
            if ( this._uniqueList[addressUnique] >= this._scope.argv.masterCluster.serverCluster.serverSocket.maximumIdenticalIps ){
                addressUnique = "";
                throw new Exception(this, "maximum identical IPs has exceeded", addressUnique);
            }

            if ( !this._uniqueList[addressUnique] ) this._uniqueList[addressUnique] = 0;
            this._uniqueList[addressUnique] ++;

            /**
             *  Store the socket unique id
             */
            this._scope.masterCluster.includeSocket( newServerClientSocket );

            /**
             * Initialize the routes for the serverSocket router
             */

            if (this._serverClientSocketRouter)
                this._serverClientSocketRouter.initRoutes( newServerClientSocket, newServerClientSocket.on.bind(newServerClientSocket), undefined, undefined, '', 'serve-socket');

            newServerClientSocket.emit("handshake", this._serverClientSocketRouter.handshake( this._scope.masterCluster.consensusType ) );

            const answerReady = await newServerClientSocket.onceAsync("ready!", this._scope.argv.masterCluster.timeout );
            if ( !answerReady  ) throw new Exception(this, "ready! answer was not received");
            if ( answerReady !== "go!" ) throw new Exception(this, "ready! answer is not ok", answerReady);

            /**
             * Inserting the clientSocket into connected list
             */
            this._scope.masterCluster.totalPeers.updatePeers(0, +1 );

            const connectedNode = new ConnectedNodeSchema( {

                ...this._scope,
                socket: newServerClientSocket,
                connectingNode: undefined,
                connection: NodeConnectionTypeEnum.connectionServerSocket,

            }, undefined, {

                ...newServerClientSocket.handshake,
                serverAddress: newServerClientSocket.serverAddress ? newServerClientSocket.serverAddress.toString() : undefined,
                address: newServerClientSocket.address.toString(),
                seedNode: false,
                date: this._scope.argv.settings.getDateNow(),

            } );

            await connectedNode.save();

            /**
             * Removing the clientSocket from the connected list
             */
            socket.once("disconnect", ()=>{

                delete this.list[address];
                this.listCount--;

                this._uniqueList[addressUnique]--;
                if (this._uniqueList[addressUnique] === 0) delete this._uniqueList[addressUnique];

                this._scope.masterCluster.totalPeers.updatePeers(0, -1 );

                this._scope.logger.info(this, "Server Socket Disconnected", connectedNode.address.toString() );

            });

            this._scope.logger.info(this, "Server Socket Connected", connectedNode.address.toString() );

        } catch (err){

            if (err instanceof Exception && (err.message === "maximum connections has exceeded" || err.message === "maximum identical IPs has exceeded" ) )
                socket.emit("other-nodes", this._scope.masterCluster.knownNodes.knownNodesRandom);

            if (address && this.list[address] && this.list[address] === newServerClientSocket)  {
                delete this.list[address];
                this.listCount--;
            }

            if (addressUnique) {
                this._uniqueList[addressUnique]--;
                if (this._uniqueList[addressUnique] === 0) delete this._uniqueList[addressUnique];
            }

            if (newServerClientSocket )
                this._scope.masterCluster.removeSocket(newServerClientSocket);


            //this._scope.logger.error(this, `Socket Recently Disconnected `, err );

            socket.disconnect();

            return false;
        }

        return true;

    }

    broadcast(name, data, senderSockets = {}){

        //this._scope.logger.log(this, "broadcasting to: " + this.listCount + " servers");

        for (const address in this.list)
            if (!senderSockets[this.list[address].id])
                this.list[address].emit(name, data);

        return this.listCount;

    }

    async broadcastAsync(name, data, timeout, senderSockets = {}){

        //this._scope.logger.log(this, "broadcasting to: " + this.listCount + " servers");

        let array = [];
        for (const address in this.list)
            if (!senderSockets[this.list[address].id])
                array.push( this.list[address].emitAsync(name, data, timeout));

        array = await Promise.all(array);

        const out = [];
        for (let i=0; i < array.length; i++) array[i] = out[i];

        return out;

    }


}

