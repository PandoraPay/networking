const {DBSchema} = require('kernel').marshal.db;
const {Helper} = require('kernel').helpers;

const NodeBaseSchema = require("./node-base-schema");
const NodeConsensusTypeEnum = require("../../../../schemas/types/node-consensus-type-enum")

/**
 * Schema element used to create a Sorted List 8with a queue to connect to consensus nodes
 */

module.exports = class NodeScoreBaseSchema extends NodeBaseSchema {

    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge( {

                fields:{

                    /**
                     * Score combines (latency, fails, successes)
                     * Score to sort the list by a feedback score
                     */
                    score: {

                        type: "number",
                        default: 1000,
                        maxSize: 1 << 16 - 1,

                        position: 201,
                    },

                }

            },
            schema, false), data, type, creationOptions);

    }

    get pendingClients(){
        return this._scope.masterCluster.clientsCluster.pendingClients;
    }

}

