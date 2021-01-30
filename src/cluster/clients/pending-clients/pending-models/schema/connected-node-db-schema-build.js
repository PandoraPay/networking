const {DBSchemaBuild} = require('kernel').db;
const {Helper, Exception, EnumHelper} = require('kernel').helpers;
const NodeConnectionTypeEnum = require( "../../../../network-models/types/node-connection-type-enum");
const ipAddress = require("../../../../../network/ip-address")

const {NodeBaseDBSchemaBuild} = require('../base/schema/node-base-db-schema-build')

class ConnectedNodeDBSchemaBuild extends NodeBaseDBSchemaBuild {

    constructor(schema) {

        super(Helper.merge( {

            fields:{

                table: {
                    default: "node_connect",
                    fixedBytes: 12,
                },

                connection: {

                    type: "number",
                    validation: value => EnumHelper.validateEnum(value, NodeConnectionTypeEnum ),

                    position: 201,
                },

                serverAddress: {
                    /**
                     * Address contains protocol, address and port
                     */
                    type: "string",
                    default: "0.0.0.0:0",

                    /**
                     * Validate the address and use the normalized version
                     */
                    preprocessor (value , name ) {
                        this._ipServerAddress = ipAddress.create(value);
                        return this._ipServerAddress.toString();
                    },

                    position: 202,
                },

            }
        },  schema, true) );

    }

}

module.exports = {
    ConnectedNodeDBSchemaBuild,
    ConnectedNodeDBSchemaBuilt: new ConnectedNodeDBSchemaBuild(),
}