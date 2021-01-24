const ArgvClientsMasterCluster = require( "./clients/argv-clients-cluster");
const ArgvServerMasterCluster = require("./server/argv-server-cluster");

module.exports = {

    clientsCluster: ArgvClientsMasterCluster,
    serverCluster: ArgvServerMasterCluster,

}