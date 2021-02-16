const {DBSchemaBuild} = PandoraLibrary.db;
const {Helper, Exception, EnumHelper} = PandoraLibrary.helpers;

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

            },

            options:{
                hashing:{
                    enabled: false,
                }
            }

        }, schema, true));
    }

}

module.exports = {
    TotalPeersSchemaBuild,
    TotalPeersSchemaBuilt: new TotalPeersSchemaBuild()
}