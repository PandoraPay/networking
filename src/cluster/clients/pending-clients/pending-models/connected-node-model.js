const {Helper, EnumHelper} = require('kernel').helpers;

const NodeConnectionTypeEnum = require("../../../network-models/types/node-connection-type-enum");
const NodeBaseModel = require( "./base/node-base-model");

const {ConnectedNodeSchemaBuilt} = require('./schema/connected-node-schema-build')

module.exports = class ConnectedNodeModel extends NodeBaseModel  {

    /**
     * It saves automatically in the database
     */

    constructor( scope, schema = ConnectedNodeSchemaBuilt, data, type, creationOptions ){

        super(scope, schema, data, type, creationOptions);

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

    async createConnectingNode(ConnectingNodeModel){

        let add = false;

        if (this.connection === NodeConnectionTypeEnum.connectionClientSocket) add = true;
        else
        if (this.connection === NodeConnectionTypeEnum.connectionServerSocket && this.serverAddress !== "0.0.0.0:0") add = true;

        if (!add) return;

        const connectingNode = new ConnectingNodeModel( this._scope, undefined, {

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

