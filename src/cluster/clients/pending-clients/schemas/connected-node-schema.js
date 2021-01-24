const {Helper, EnumHelper} = require('kernel').helpers;

const NodeConsensusTypeEnum = require("../../../schemas/types/node-consensus-type-enum")
const NodeConnectionTypeEnum = require("../../../schemas/types/node-connection-type-enum");
const NodeScoreBaseSchema = require( "./base/node-score-base-schema");
const ipAddress = require( "../../../../network/ip-address");

module.exports = class ConnectedNodeSchema extends NodeScoreBaseSchema {

    /**
     * It saves automatically in the database
     */

    constructor( scope, schema = { }, data, type, creationOptions ){

        super(scope, Helper.merge({

                fields:{

                    table: {
                        default: "node_connect",
                        fixedBytes: 12,
                    },

                    connection: {

                        type: "number",
                        validation: value => EnumHelper.validateEnum(value, NodeConnectionTypeEnum ),

                        position: 201,
                    },

                    serverAddress: {
                        /**
                         * Address contains protocol, address and port
                         */
                        type: "string",
                        default: "0.0.0.0:0",

                        /**
                         * Validate the address and use the normalized version
                         */
                        preprocessor (value , name ) {
                            this._ipServerAddress = ipAddress.create(value);
                            return this._ipServerAddress.toString();
                        },

                        position: 202,
                    },

                }
            },
            schema, false), data, type, creationOptions);

        //socket attached
        if (scope.socket) {

            //clientSocket
            if (scope.socket.connected){

                if (this.serverAddress !== '0.0.0.0:0') {
                    this._scope.heartBeat.addProcessAndTask("connectedNodeIncreaseScore", this._increaseScore.bind(this), 2, this.id, false);
                    this._scope.heartBeat.addProcessAndTask("connectedNodeCollectStats", this._collectStats.bind(this), 2, this.id, false);
                }

                scope.socket.once("disconnect", this._socketDisconnected.bind(this) );

            }
            else
                this._socketDisconnected();

        }

        this.save = this._save;
        this.delete = this._delete;
    }

    async _save(){
        return this.pendingClients.insertConnectedNode(this, this.id, true);
    }

    async _delete(){
        return this.pendingClients.removeConnectedNode( this.id, true);
    }

    async _increaseScore(){

        const newScore = this.score + 1;
        if ( newScore > this.checkProperty("maxSize", "score") ) return this._scope.heartBeat.removeTaskFromProcess( "connectedNodeIncreaseScore", this.id  );

        this.score = newScore;
        return this.save();

    }

    _unmarshalStats(stats){

        this.unmarshal( {
            build: stats.build,
            date: this._scope.argv.settings.getDateNow(),
        }, "object", undefined, {

            onlyFields:{
                build: true,
                date: true,
            }

        });

    }

    async _collectStats(){

        const stats = await this._scope.socket.emitAsync ("stats", undefined, this._scope.argv.masterCluster.timeout );

        if ( !stats || typeof stats !== "object" ) {

            if (!this._errorCollectingStats) this._errorCollectingStats = 0;
            this._errorCollectingStats ++;

            if (this._errorCollectingStats > 5)
                return this._scope.socket.disconnect();

        } else {

            this._unmarshalStats(stats);

        }


        await this.save();

    }

    async _socketDisconnected(){

        await this._scope.heartBeat.removeTaskFromProcess( "connectedNodeIncreaseScore", this.id  );
        await this._scope.heartBeat.removeTaskFromProcess( "connectedNodeCollectStats", this.id  );

        //remove reference to me
        if (this._scope.connectingNode) {
            this._scope.connectingNode.score = this.score;
            await this._scope.connectingNode.save();
        }

        await this.delete();

    }

    async createConnectingNode(ConnectingNodeSchema){

        let add = false;

        if (this.connection === NodeConnectionTypeEnum.connectionClientSocket) add = true;
        else
        if (this.connection === NodeConnectionTypeEnum.connectionServerSocket && this.serverAddress !== "0.0.0.0:0") add = true;

        if (!add) return;

        const connectingNode = new ConnectingNodeSchema( this._scope, undefined, {

            ...this._getData(),
            address: this.serverAddress !== "0.0.0.0:0" ? this.serverAddress : this.address,

        } );

        return connectingNode.save();

    }

    getPublicInfo(){
        return {
            address: this.serverAddress,
            build: this.build,
            node: this.node,
            consensus:  this.consensus,
        }
    }


}

