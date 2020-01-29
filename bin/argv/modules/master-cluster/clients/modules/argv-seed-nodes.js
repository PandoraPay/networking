import NodeTypeEnum from "src/cluster/schemas/types/node-type-enum"
import NodeConsensusTypeEnum from "src/cluster/schemas/types/node-consensus-type-enum"

/**
 * Arguments for Seed Nodes
 */

export default {

    review: "15/07/2017",

    seedList: [ {
            address: "http://127.0.0.1:80",
            build: "0.1",
            node: NodeTypeEnum.nodeConsensus,
            consensus:  NodeConsensusTypeEnum.CONSENSUS_FULL,

        }, {
            address: "http://127.0.0.1:8080",
            build: "0.1",
            node: NodeTypeEnum.nodeConsensus,
            consensus:  NodeConsensusTypeEnum.CONSENSUS_FULL,

        }

    ],

    /**
     * all nodes are connected to the localhost master cluster
     * @private
     */
    _initArgv( parents ){

        if (!parents[0].debug.enabled) return;

        const parentCluster = parents[parents.length-2];

        this.seedList = [];

        for (let i=0; i < parentCluster.workerCount; i++)
            this.seedList.push({
                address:  `http://127.0.0.1:${parentCluster.serverCluster.httpServer.port + i + 1 }`,
                build: parents[0].settings.buildVersion,
                node: NodeTypeEnum.nodeConsensus,
                consensus:  NodeConsensusTypeEnum.CONSENSUS_FULL,
            });

    }

}