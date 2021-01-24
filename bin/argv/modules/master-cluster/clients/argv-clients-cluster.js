const ArgvPendingClients = require( "./modules/argv-pending-clients")
const ArgvSeedNodes = require("./modules/argv-seed-nodes")
const ArgvClientSocket = require("./modules/argv-client-socket");

/**
 * Arguments for Clients Cluster
 */

module.exports = {

    createWorkers: true,

    pendingClients: ArgvPendingClients,
    seedNodes: ArgvSeedNodes,

    clientSocket: ArgvClientSocket,

}