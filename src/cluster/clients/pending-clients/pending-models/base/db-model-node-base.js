const {DBModel} = require('kernel').db;
const {DBSchemaBuiltNodeBase} = require('./schema/db-schema-build-node-base')

/**
 * Schema element used to create a Sorted List with a queue to connect to consensus nodes
 */

//TODO In case the network will get a lot of spam in the ip list, we can introduce a proof of work in the node base schema to avoid ip lists spam

module.exports = class DBModelNodeBase extends DBModel {

    constructor(scope, schema = DBSchemaBuiltNodeBase, data, type , creationOptions){
        super(scope, schema, data, type, creationOptions);
    }

    _getData(){

        return {
            seedNode: this.seedNode,
            ...this.toObject(false )
        }

    }

    get pendingClients(){
        return this._scope.masterCluster.clientsCluster.pendingClients;
    }

}

