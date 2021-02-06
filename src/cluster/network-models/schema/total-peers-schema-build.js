const {DBSchemaBuild} = require('kernel').db;
const {Helper, Exception, EnumHelper} = require('kernel').helpers;

class TotalPeersSchemaBuild extends DBSchemaBuild{

    constructor(schema) {

        super(Helper.merge( {

            fields:{

                table: {
                    default: "network",
                    minSize: 7,
                    maxSize: 7,
                },

                id: {
                    default: "TotalPeers",
                    minSize: 10,
                    maxSize: 10,
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
    TotalPeersSchemaBuild,
    TotalPeersSchemaBuilt: new TotalPeersSchemaBuild()
}