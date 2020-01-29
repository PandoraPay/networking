import ArgvPendingClients from "./modules/argv-pending-clients"
import ArgvSeedNodes from "./modules/argv-seed-nodes"
import ArgvClientSocket from "./modules/argv-client-socket";

/**
 * Arguments for Clients Cluster
 */

export default {

    createWorkers: true,

    pendingClients: ArgvPendingClients,
    seedNodes: ArgvSeedNodes,

    clientSocket: ArgvClientSocket,

}