const {DBSchemaBuild} = require('kernel').db;
const {Helper, Exception, EnumHelper} = require('kernel').helpers;

const {DBSchemaBuildNodeBase} = require('../base/schema/db-schema-build-node-base')

class DBSchemaBuildConnectingNode extends DBSchemaBuildNodeBase{

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
    DBSchemaBuildConnectingNode,
    DBSchemaBuiltConnectingNode: new DBSchemaBuildConnectingNode(),
}