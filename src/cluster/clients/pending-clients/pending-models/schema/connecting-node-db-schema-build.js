const {DBSchemaBuild} = require('kernel').db;
const {Helper, Exception, EnumHelper} = require('kernel').helpers;

const {NodeBaseDBSchemaBuild} = require('../base/schema/node-base-db-schema-build')

class ConnectingNodeDBSchemaBuild extends NodeBaseDBSchemaBuild{

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
    ConnectingNodeDBSchemaBuild,
    ConnectingNodeDBSchemaBuilt: new ConnectingNodeDBSchemaBuild(),
}