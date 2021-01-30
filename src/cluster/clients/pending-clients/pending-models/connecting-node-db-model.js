const {Helper} = require('kernel').helpers;

const NodeConnectionTypeEnum = require( "../../../network-models/types/node-connection-type-enum");
const NodeConsensusTypeEnum = require( "../../../network-models/types/node-consensus-type-enum")
const NodeTypeEnum = require("../../../network-models/types/node-type-enum");

const ConnectedNodeDBModel = require("./connected-node-db-model");
const NodeBaseDBModel = require("./base/base-db-model-node");
const NetworkClientSocket = require("../client/websocket/network-client-socket");

const ipAddress = require("../../../../network/ip-address");

const {ConnectingNodeDBSchemaBuilt} = require('./schema/connecting-node-db-schema-build')

/**
 * Schema element used to create a Sorted List 8with a queue to connect to consensus nodes
 */

module.exports = class ConnectingNodeDBSchema extends NodeBaseDBModel {

    constructor(scope, schema = ConnectingNodeDBSchemaBuilt, data, type , creationOptions){

        super(scope, schema, data, type, creationOptions);

        this.connectedNode = undefined;
        this.client = undefined;

        this.save = this._save;
        this.delete = this._delete;
    }

    async _save(){
        return this.pendingClients.insertConnectingNode(this, this.id, true);
    }

    async _delete(){
        return this.pendingClients.removeConnectingNode( this.id, true);
    }

    /**
     * A deadlock lock is create before and it will released after the update
     */
    async connectClient(  ){

        this._scope.logger.log(this, "connectClient");

        const client = new NetworkClientSocket({
            ...this._scope,
        }, ipAddress.create( undefined, this.address )  );

        try {

            const connected = await client.connectAsync();
            if (!connected) throw "failed to connect";

            return client;

        } catch (err){

            //this._scope.logger.error(this, `Couldn't connect client to ${this.address}`, err );

            //make sure it got disconnected
            if (client && client._socket) client.disconnect();

            const newScore = this.score - 1;
            if (newScore >= this.checkProperty("minSize", "score" )){
                this.score -= 2;
                await this.save();
            }

        }

    }

    createConnectedNode( client ){

        this.connectedNode = new ConnectedNodeDBModel( {

            ...this._scope,
            socket: client,
            connectingNode: this,
            connection: NodeConnectionTypeEnum.connectionClientSocket,

        }, undefined, {

            ...this._getData(),
            ...client.handshake,
            serverAddress: client.serverAddress.toString(),

        } );

        return this.connectedNode;
    }

    getPublicInfo(){
        return {
            address: this.address,
            build: this.build,
            node: this.node,
            consensus:  this.consensus,
        }
    }

}

