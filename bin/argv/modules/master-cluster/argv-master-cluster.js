const ArgvClientsMasterCluster = require( "./clients/argv-clients-cluster")
const ArgvServerMasterCluster = require("./server/argv-server-cluster")

/**
 * Arguments for Master Cluster
 */

module.exports = {


    clientsCluster: ArgvClientsMasterCluster,
    serverCluster: ArgvServerMasterCluster,

    createClusters: true,

    workerCount: 3,

    timeout: 2000,

}
