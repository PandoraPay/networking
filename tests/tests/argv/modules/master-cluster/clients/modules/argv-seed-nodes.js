const NodeTypeEnum = require("../../../../../../../src/cluster/network-models/types/node-type-enum");
const NodeConsensusTypeEnum = require( "../../../../../../../src/cluster/network-models/types/node-consensus-type-enum");

module.exports = {

    /**
     * all nodes are connected to the localhost master cluster
     * @private
     */
    _initArgv( parents ){

        this.review = new Date().toString();

        this.seedList = [];

        const parentCluster = parents[parents.length-2];

        for (let i=0; i < parentCluster.workerCount; i++)
            this.seedList.push({
                address:  `${parentCluster.serverCluster.serverSocket.protocol}${parentCluster.serverCluster.httpServer.sslUse ? 's' : ''}://127.0.0.1:${parentCluster.serverCluster.httpServer.port + i + 1 }`,
                build: parents[0].settings.buildVersion,
                node: NodeTypeEnum.nodeConsensus,
                consensus:  NodeConsensusTypeEnum.CONSENSUS_FULL,
            });

    }

}