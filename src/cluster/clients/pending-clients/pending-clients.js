const {Exception, BufferHelper } = require('kernel').helpers;

const NodeConnectionTypeEnum = require( "../../network-models/types/node-connection-type-enum" )

const DBModelConnectingNode = require( "./pending-models/connecting-node-db-model");
const ConnectedNodeDBModel = require( "./pending-models/connected-node-db-model");

module.exports = class PendingClients {

    constructor(scope) {

        this._scope = scope;
        this._started = false;

        this._resetPendingClients();

    }

    _resetPendingClients(){

        this._connectingList = [];
        this._connectingMap = {};

        this._connectedList = [];
        this._connectedMap = {};

    }

    async init(){

        if (this._init) return true;
        this._init = true;

        if ( this._scope.db.isSynchronized ) {

            this._scope.masterCluster.on(  "pending-clients",async data => {

                if (data.name === "pending-clients/insert-connecting-node")
                    await this.insertConnectingNode(data.connectingNode, data.id, false);
                else if (data.name === "pending-clients/remove-connecting-node")
                    await this.removeConnectingNode( data.id, false);
                else if (data.name === "pending-clients/insert-connected-node")
                    await this.insertConnectedNode(data.connectedNode, data.id, false);
                else if (data.name === "pending-clients/remove-connected-node")
                    await this.removeConnectedNode(data.id, false);

            });
        }

        this._scope.masterCluster.startedPromise.then( async answer => {

            if (!this._scope.heartBeat.existsProcess("connectingPendingClients"))
                this._scope.heartBeat.addProcessAndTask("connectingPendingClients", this._connectPendingClientsInterval.bind(this), 1, "default", false);

            /**
             * In case the cluster is master, clear the previous pending queue and fill it with the seed nodes
             */

            //clear the pending queue
            await this._clearPendingQueue();
            await this._clearConnectedList();

        });

    }

    async insertConnectingNode(connectingNode, id, propagateToMasterCluster = true){

        if (!this._connectingMap[id]){

            if (!(connectingNode instanceof DBModelConnectingNode))
                connectingNode = new DBModelConnectingNode( this._scope, undefined, connectingNode );

            this._connectingMap[connectingNode.id] = connectingNode;
            this._connectingList.push(connectingNode);

            if (propagateToMasterCluster && this._scope.db.isSynchronized )
                await this._scope.masterCluster.sendMessage( "pending-clients", {
                    name: "pending-clients/insert-connecting-node",
                    connectingNode: connectingNode.toBuffer(),
                    id: connectingNode.id,
                }, true, false);

        }

    }

    async removeConnectingNode( id, propagateToMasterCluster = true){

        if (this._connectingMap[id]){

            this._connectingList.splice( this._connectingList.indexOf(this._connectingMap[id]), 1);
            delete this._connectingMap[id];

            if (propagateToMasterCluster && this._scope.db.isSynchronized )
                await this._scope.masterCluster.sendMessage("pending-clients", {
                    name: "pending-clients/remove-connecting-node",
                    id: id,
                }, true, false);

        }

    }

    async insertConnectedNode(connectedNode, id, propagateToMasterCluster = true){

        if (!this._connectedMap[id]){

            if (!(connectedNode instanceof ConnectedNodeDBModel))
                connectedNode = new ConnectedNodeDBModel( this._scope, undefined, connectedNode );

            this._connectedMap[connectedNode.id] = connectedNode;
            this._connectedList.push(connectedNode);

            if (propagateToMasterCluster && this._scope.db.isSynchronized )
                await this._scope.masterCluster.sendMessage("pending-clients", {
                    name: "pending-clients/insert-connected-node",
                    connectedNode: connectedNode.toBuffer(),
                    id: connectedNode.id,
                }, true, false);

        }

    }

    async removeConnectedNode(id, propagateTxMasterCluster = true){

        if (this._connectedMap[id]){

            this._connectedList.splice( this._connectedList.indexOf(this._connectedMap[id]), 1);
            delete this._connectedMap[id];

            if (propagateTxMasterCluster && this._scope.db.isSynchronized )
                await this._scope.masterCluster.sendMessage("pending-clients", {
                    name: "pending-clients/remove-connected-node",
                    id: id,
                }, true, false);

        }

    }

    async start() {

        if (this._started) return true;
        this._started = true;

    }

    async close (){

        if (!this._started) return true;

        await Promise.all([
            this._scope.heartBeat.removeProcess( "connectingPendingClients" ),
        ]);

        this._started = false;

    }

    async _connectPendingClients(){

        const connectingNodes = this._connectingList;

        try{

            connectingNodes.sort( (a,b) => b.score - a.score );

            for (let i=0; i < connectingNodes.length; i++) {

                const connectingNode = connectingNodes[i];

                if ( this._scope.bansManager.checkBan("client", connectingNode.address ) )
                    return;

                let lock = !this._scope.db.isSynchronized;

                if (this._scope.db.isSynchronized)
                    lock = await connectingNode.lock( this._scope.argv.masterCluster.clientsCluster.pendingClients.timeoutLock, -1);

                //lock acquired
                if (lock){

                    this._scope.logger.info( this, 'locking done', { connectingNode: connectingNode.id, lock: !!lock } );

                    try {

                        const clientSocket = await connectingNode.connectClient( );

                        if (clientSocket && clientSocket.connected) {

                            if (await this._scope.clientsCluster.clientSocketConnected(connectingNode, clientSocket)) {
                                this._scope.clientSocketRouter.initRoutes(clientSocket, clientSocket.on.bind(clientSocket), undefined, undefined, '', 'client-socket');
                                clientSocket.emit("ready!", "go!");
                            }

                        }

                    } catch (err){
                        this._scope.logger.error(this, "connecting to raised an error", err);
                    }finally{
                        //release lock
                        if (typeof lock === "function" ) await lock();
                    }

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

        this._connectingList = [];
        this._connectingMap = {};

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

            if (this._scope.argv.masterCluster.clientsCluster.pendingClients.convertConnectedNodesToQueueNodes)
                await Promise.all ( this._connectedList.map( it => it.createConnectingNode(DBModelConnectingNode) ) );


        }catch (err){
            this._scope.logger.error(this, "Converting Connected Nodes To Queue Nodes raised an error", err);
        }

        try{

            //clear all connected nodes
            if (this._scope.argv.masterCluster.clientsCluster.pendingClients.deleteConnectedNodes)
                for (const key in this._connectedMap)
                    await this.removeConnectedNode(key, true);

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

            const nodeQueue = new DBModelConnectingNode( this._scope, undefined, pendingConnection );

            let save = isSeedNode;
            if (!this._connectedMap[nodeQueue.id] && !this._connectingMap[nodeQueue.id]) save = true;

            if (save)
                await nodeQueue.save();


            return nodeQueue;

        } catch (err){
            console.error(err);
            throw new Exception( this, err,  { pendingConnection: pendingConnection } );
        }

    }


}

