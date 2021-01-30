const {DBSchemaBuild} = require('kernel').db;
const {Helper, Exception, EnumHelper} = require('kernel').helpers;

class TotalPeersDBSchemaBuild extends DBSchemaBuild{

    constructor(schema) {

        super(Helper.merge( {

            fields:{

                table: {
                    default: "network",
                    fixedBytes: 7,
                },

                id: {
                    default: "TotalPeers",
                    fixedBytes: 10,
                },

                count: {
                    type: "number",
                    position: 100,
                },

                client: {
                    type: "number",
                    position: 101,
                },

                server: {
                    type: "number",
                    position: 102,
                }

            }

        }, schema, true));
    }

}

module.exports = {
    TotalPeersDBSchemaBuild,
    TotalPeersDBSchemaBuilt: new TotalPeersDBSchemaBuild()
}