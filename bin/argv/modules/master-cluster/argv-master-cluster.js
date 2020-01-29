import ArgvClientsMasterCluster from "./clients/argv-clients-cluster"
import ArgvServerMasterCluster from "./server/argv-server-cluster"

/**
 * Arguments for Master Cluster
 */

export default {


    clientsCluster: ArgvClientsMasterCluster,
    serverCluster: ArgvServerMasterCluster,

    createClusters: true,

    workerCount: 3,

    timeout: 2000,

}
