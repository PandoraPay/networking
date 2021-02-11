
const {MasterCluster} = require('kernel').masterCluster;
const {Helper} = require('kernel').helpers;

const NetworkServerCluster = BROWSER ? undefined : require("./server/network-server-cluster");

const NetworkClientsCluster = require( "./clients/network-clients-cluster" )
const TotalPeersModel = require( "./network-models/total-peers-model");
const KnownNodes = require( "./known-nodes");
const NodeConsensusTypeEnum = require( "./network-models/types/node-consensus-type-enum")

module.exports = class NetworkMasterCluster extends MasterCluster {

    constructor(scope){

        super(undefined, false);

        this.consensusType = NodeConsensusTypeEnum.CONSENSUS_FULL;

        /**
         * List using socket unique id
         */
        this.allSockets = { };
        this.allSocketsCount = 0;

        setInterval( ()=> this._scope.logger.log(this, `allSocketsCount ${this.allSocketsCount}`), 60000);

        /**
         * Apply the rest of the constructor
         */
        this._constructor( {
            ClientsCluster: NetworkClientsCluster,
            ServerCluster: NetworkServerCluster,
            ...scope,
        });

        /**
         * Create Total Peers
         */
        this.totalPeers = new TotalPeersModel({
            ...this._scope,
            masterCluster: this,
        });

        /**
         * Create Public List
         */
        this.knownNodes = new  KnownNodes({
            ...this._scope,
            masterCluster: this,
        });


    }

    async _started(){

        await this.totalPeers.start();

        await super._started.call(this);

        await this.knownNodes.start();

    }

    async _closed (){

        return Promise.all( [
            super._closed.call(this),
            this.totalPeers.stop(),
            this.knownNodes.stop(),
        ]);

    }

    includeSocket(socket){

        if (!this.allSockets[socket.id]) {
            this.allSockets[socket.id] = socket;
            this.allSocketsCount++;

            if (!socket.__includeSocketInitialized) {
                socket.__includeSocketInitialized = true;
                socket.once("disconnect", () => {
                    this.removeSocket(socket);
                });
            }

        }

    }

    removeSocket(socket){

        if (this.allSockets[socket.id]) {
            delete this.allSockets[socket.id];
            this.allSocketsCount--;
        }

    }

    broadcastToSockets(name, data, senderSockets = {}){

        if ( Array.isArray(senderSockets)  ) {
            const hashMap = {};
            senderSockets.map( it => hashMap[ typeof it === "string" ? it : it.id ] = true );
            senderSockets = hashMap;
        }

        let clients = 0, server = 0;
        if (this.clientsCluster)
            clients = this.clientsCluster.broadcastToSockets(name, data, senderSockets);

        if (this.serverCluster)
            server = this.serverCluster.broadcastToSockets(name, data, senderSockets);

        return clients + server;

    }

    async broadcastToSocketsAsync(name, data, timeout, senderSockets={}, filter ){

        if ( Array.isArray(senderSockets)  ) {
            const hashMap = {};
            senderSockets.map( it => hashMap[ typeof it === "string" ? it : it.id ] = true );
            senderSockets = hashMap;
        }

        let array = [];
        if (this.clientsCluster)
            array.push( this.clientsCluster.broadcastToSocketsAsync(name, data, timeout, senderSockets, filter) );

        if (this.serverCluster)
            array.push( this.serverCluster.broadcastToSocketsAsync(name, data, timeout, senderSockets, filter) );

        array = await Promise.all(array);

        const out = [];
        for (let i=0; i < array.length; i++) array[i] = out[i];

        return out.length === 2 ? out[0].concat(out[1]) : out[0];
    }

}

