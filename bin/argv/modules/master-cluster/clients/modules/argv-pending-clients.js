/**
 * Arguments for Pending Clients
 */

export default {

    /**
     * Per Cluster Instance
     */
    maxConnectedClients: {

        "node": 10,

    },

    timeoutLock: 10000,
    timeoutConnection: 2000,

    convertConnectedNodesToQueueNodes : true,
    deleteConnectedNodes : true,

}