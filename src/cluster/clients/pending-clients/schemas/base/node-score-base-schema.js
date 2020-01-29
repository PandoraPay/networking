const {DBSchema} = global.kernel.marshal.db;
const {Helper} = global.kernel.helpers;

import NodeBaseSchema from "./node-base-schema";
import NodeConsensusTypeEnum from "src/cluster/schemas/types/node-consensus-type-enum"

/**
 * Schema element used to create a Sorted List 8with a queue to connect to consensus nodes
 */

export default class NodeScoreBaseSchema extends NodeBaseSchema {

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

                        sorts: {

                            scoreClientsConsensus: {
                                filter() {
                                    return this.consensus === NodeConsensusTypeEnum.nodeConsensus;
                                },
                            }

                        },

                        position: 201,
                    },

                }

            },
            schema, false), data, type, creationOptions);

    }



}

