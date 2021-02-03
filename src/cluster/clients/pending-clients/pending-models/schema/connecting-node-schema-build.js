const {DBSchemaBuild} = require('kernel').db;
const {Helper, Exception, EnumHelper} = require('kernel').helpers;

const {NodeBaseSchemaBuild} = require('../base/schema/node-base-schema-build')

class ConnectingNodeSchemaBuild extends NodeBaseSchemaBuild{

    constructor(schema) {

        super(Helper.merge( {

            fields:{

                table: {

                    default: "node_list",
                    fixedBytes: 9,

                },

            }

        },  schema, true));

    }

}

module.exports = {
    ConnectingNodeSchemaBuild,
    ConnectingNodeSchemaBuilt: new ConnectingNodeSchemaBuild(),
}