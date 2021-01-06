import ipAddress from "src/network/ip-address"

const {Exception, BufferHelper } = global.kernel.helpers;

import NetworkClientSocket from 'src/cluster/clients/pending-clients/client/websocket/network-client-socket';
import NetworkClientSocketRouter from 'src/cluster/clients/pending-clients/client/websocket/network-client-socket-router';

import NodeConnectionTypeEnum from "../../schemas/types/node-connection-type-enum"

import ConnectingNodeSchema from "./schemas/connecting-node-schema";
import ConnectedNodeSchema from "./schemas/connected-node-schema";

export default class PendingClients {

    constructor(scope) {

        this._scope = {
            ClientSocket: NetworkClientSocket,
            ClientSocketRouter: NetworkClientSocketRouter,
            ...scope,
        };

        this._started = false;

        this._resetPendingClients();

    }

    _resetPendingClients(){

        this._pendingList = [];
        this._pendingMap = {};

        this._connectedList = [];
        this._connectedMap = {};

    }

    async init(){

        if (this._init) return true;
        this._init = true;

        this._clientSocketRouter = new this._scope.ClientSocketRouter( {
            ...this._scope,
            socketType: "clientSocket",
        });

        /**
         * In case the cluster is master, clear the previous pending queue and fill it with the seed nodes
         */

        if (!this._scope.db) return;

        if ( this._scope.masterCluster.isMaster || !this._scope.db.isSynchronized) {

            //clear the pending queue
            await this._clearPendingQueue();
            await this._clearConnectedList();

        }

    }

    async start() {

        if (this._started) return true;
        this._started = true;


        this._scope.masterCluster.on("ready-master!", data =>{

            if ( !data.result ) return;

            if (!this._scope.heartBeat.existsProcess("connectingPendingClients"))
                this._scope.heartBeat.addProcessAndTask("connectingPendingClients", this._connectPendingClientsInterval.bind(this), 1, "default", false);

        });

    }

    async close (){

        if (!this._started) return true;

        await Promise.all([
            this._scope.heartBeat.removeProcess( "connectingPendingClients" ),
        ]);

        this._started = false;

    }

    async _connectPendingClients(){

        const nodesQueueIds = this._pendingList;

        try{

            nodesQueueIds.sort( (a,b) => b.score - a.score );

            for (let i=0; i < nodesQueueIds.length; i++) {

                const nodeQueue = nodesQueueIds[i];

                const ip = ipAddress.create( nodeQueue.id );
                if ( this._scope.bansManager.checkBan("client", ip.toString() ) )
                    return;

                let lock = !this._scope.db.isSynchronized;

                if (this._scope.db.isSynchronized)
                    lock = await nodeQueue.lock( this._scope.argv.masterCluster.clientsCluster.pendingClients.timeoutLock, -1);

                //lock acquired
                if (lock){

                    try {

                        const clientSocket = await nodeQueue.connectClient( );

                        if (clientSocket && clientSocket.connected) {

                            if (await this._scope.clientsCluster.clientSocketConnected(nodeQueue, clientSocket)) {
                                this._clientSocketRouter.initRoutes(clientSocket, clientSocket.on.bind(clientSocket), undefined, undefined, '', 'client-socket');
                                clientSocket.emit("ready!", "go!");
                            }

                        }

                    } catch (err){
                        this._scope.logger.error(this, "connecting to raised an error", err);
                    }

                    //release lock
                    if (typeof lock === "function" ) await lock();
                }

            }

        }catch (err){
            console.error(err);
        }

    }

    async _connectPendingClientsInterval(){

        try{

            await this._connectPendingClients();

        } catch (err){
            this._scope.logger.error( this, "Connect Pending Clients raised an error", err );
        }

    }

    async getSeedNodes(){
        return this._scope.argv.masterCluster.clientsCluster.seedNodes.seedList;
    }

    /**
     * Clear and add nodes to the pendine queue
     * @returns {Promise<boolean>}
     * @private
     */
    async _clearPendingQueue(){

        this._pendingList = [];
        this._pendingMap = {};

        const seedNodes = await this.getSeedNodes();

        await Promise.all( seedNodes.map( seedNode => this.addNodeToPendingQueue( {
            ...seedNode,
            connection:  NodeConnectionTypeEnum.connectionClientSocket,
            date: this._scope.argv.settings.getDateNow(),
            hash: BufferHelper.generateMaxBuffer(32),
        }, true ) ));

        return true;

    }

    async _clearConnectedList(){

        try{

            if (this._scope.argv.masterCluster.clientsCluster.pendingClients.convertConnectedNodesToQueueNodes) {

                await Promise.all ( this._connectedList.map( it => it.createConnectingNode() ) );
                await Promise.all ( this._connectedList.map( it => it ? it.save() : false ) );
            }

        }catch (err){
            this._scope.logger.error(this, "Converting Connected Nodes To Queue Nodes raised an error", err);
        }

        try{

            //clear all connected nodes
            if (this._scope.argv.masterCluster.clientsCluster.pendingClients.deleteConnectedNodes)
                await this._scope.db.deleteAll( ConnectedNodeSchema );

        } catch (err){
            this._scope.logger.error(this, "Deleting Connected Nodes raised an error", err);
        }

        return true;
    }

    /**
     * Insert a pending connection to the pending queue
     * @param pendingConnection
     * @returns {Promise.<void>}
     * @private
     */
    async addNodeToPendingQueue(pendingConnection = {}, isSeedNode = false){

        if ( !pendingConnection ) throw new Exception(this, "new connection is not an object");

        pendingConnection.seedNode = isSeedNode;
        pendingConnection.date = this._scope.argv.settings.getDateNow();

        try{

            /**
             * save nodeQueue
             */

            const nodeQueue = new ConnectingNodeSchema( {
                ...this._scope,
                clientSocketRouter: this._clientSocketRouter,
            }, undefined, pendingConnection );

            let save = isSeedNode;
            if (!this._pendingMap[nodeQueue.id]) save = true;

            if (save)
                await nodeQueue.save();

            return nodeQueue;

        } catch (err){
            console.error(err);
            throw new Exception( this, err,  { pendingConnection: pendingConnection } );
        }

    }


}

