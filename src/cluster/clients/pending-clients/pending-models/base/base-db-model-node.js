const {DBModel} = require('kernel').db;
const {NodeBaseDBSchemaBuilt} = require('./schema/node-base-db-schema-build')

/**
 * Schema element used to create a Sorted List with a queue to connect to consensus nodes
 */

//TODO In case the network will get a lot of spam in the ip list, we can introduce a proof of work in the node base schema to avoid ip lists spam

module.exports = class NodeBaseDBModel extends DBModel {

    constructor(scope, schema = NodeBaseDBSchemaBuilt, data, type , creationOptions){
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

