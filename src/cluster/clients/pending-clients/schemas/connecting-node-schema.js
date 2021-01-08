import NodeConnectionTypeEnum from "src/cluster/schemas/types/node-connection-type-enum";
import NodeConsensusTypeEnum from "src/cluster/schemas/types/node-consensus-type-enum"

const {Helper} = global.kernel.helpers;

import ConnectedNodeSchema from "./connected-node-schema";
import NodeScoreBaseSchema from "./base/node-score-base-schema";
import NetworkClientSocket from "../client/websocket/network-client-socket";

import NodeTypeEnum from "src/cluster/schemas/types/node-type-enum";
import ipAddress from "src/network/ip-address";

/**
 * Schema element used to create a Sorted List 8with a queue to connect to consensus nodes
 */

export default class ConnectingNodeSchema extends NodeScoreBaseSchema {

    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge( {

                fields:{

                    table: {

                        default: "node_list",
                        fixedBytes: 9,

                    },

                }

            },
            schema, false), data, type, creationOptions);

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

        this.connectedNode = new ConnectedNodeSchema( {

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

