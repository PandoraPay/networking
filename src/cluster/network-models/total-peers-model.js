const {DBModel} = require('kernel').db;
const {Helper} = require('kernel').helpers;
const {Exception} = require('kernel').helpers;

const {TotalPeersSchemaBuilt} = require('./schema/total-peers-schema-build')

module.exports = class TotalPeersModel extends DBModel {

    constructor(scope, schema = TotalPeersSchemaBuilt, data, type , creationOptions){
        super(scope, schema, data, type, creationOptions);
    }

    async start(){

        this._scope.masterCluster.on("total-peers/update",message => {

            if (message.except && message.except === this._scope.masterCluster.workerName) return;

            if (message.name === "update-client")
                this.client += message.count;
            else
            if (message.name === "update-server")
                this.server += message.count;

            if (message.name === "update-client" || message.name === "update-server" )
                this.count += message.count;

        });

        try{

            if (this._scope.masterCluster.isMaster)
                await this.delete();

        } catch (err){

        }

    }

    stop (){

    }

    async updatePeers(client=1, server = 0){

        if (!client && !server) return false;
        if ( client === server) return false;


        //acquire lock
        const lock = await this.lock( );

        if (!lock) throw new Exception(this, "lock was not acquired");

        //lock acquired
        try {

            this.count += client + server;
            this.client += client;
            this.server += server;

            if (this.count > 0 && this.client > 0 && this.server > 0)
                await this.save();

            await this._scope.masterCluster.sendMessage("total-peers/update", {
                name: client ? "update-client" : "update-server",
                count: client ? client : server,
                except: this._scope.masterCluster.workerName,
            }, true, false );


        } catch (err){
            this._scope.logger.error(this, err);
        }

        if (typeof lock === "function") await lock(); // release lock

        return true;
    }

}

