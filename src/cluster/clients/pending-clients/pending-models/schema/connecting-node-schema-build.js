const {DBSchemaBuild} = PandoraLibrary.db;
const {Helper, Exception, EnumHelper} = PandoraLibrary.helpers;

const {NodeBaseSchemaBuild} = require('../base/schema/node-base-schema-build')

class ConnectingNodeSchemaBuild extends NodeBaseSchemaBuild{

    constructor(schema) {

        super(Helper.merge( {

            fields:{

                table: {

                    default: "node_list",
                    minSize: 9,
                    maxSize: 9,

                },

            }

        },  schema, true));

    }

}

module.exports = {
    ConnectingNodeSchemaBuild,
    ConnectingNodeSchemaBuilt: new ConnectingNodeSchemaBuild(),
}