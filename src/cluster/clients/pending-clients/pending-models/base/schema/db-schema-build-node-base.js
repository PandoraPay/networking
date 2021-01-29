const {DBSchemaBuild} = require('kernel').db;
const {Helper, Exception, EnumHelper} = require('kernel').helpers;

const ipAddress = require("../../../../../../network/ip-address")
const NodeTypeEnum = require( "../../../../../network-models/types/node-type-enum" )
const NodeConsensusTypeEnum = require( "../../../../../network-models/types/node-consensus-type-enum")


class DBSchemaBuildNodeBase extends DBSchemaBuild{

    constructor(schema) {

        super(Helper.merge( {

                fields:{

                    table: {
                        default: "base_node",
                        fixedBytes: 9,
                    },

                    /**
                     * Version of Schema
                     *
                     * use this.versionString to get the versionString
                     *
                     */
                    version: {

                        type: "number",
                        default: 0,

                        validation(version){
                            return version === 0;
                        },

                        position: 101,
                    },

                    /**
                     * Version of the Node
                     *
                     * use this.versionString to get the versionString
                     *
                     */
                    build: {

                        type: "string",
                        default(){
                            return this._scope.argv.settings.buildVersion;
                        },

                        validation(build){

                            return this._scope.argv.settings.versionCompatibility( build );

                        },

                        position: 102,
                    },

                    /**
                     * Consensus Status
                     */
                    consensus: {
                        type: "number",
                        validation: value => EnumHelper.validateEnum(value, NodeConsensusTypeEnum),

                        position: 103,
                    },

                    /**
                     * Protocols supported by seed-node
                     */
                    node: {
                        type: "number",

                        default: NodeTypeEnum.nodeTunnel,

                        preprocessor(value){

                            if (typeof value === "object") value = NodeTypeEnum.combineNodeTypeEnum( value );
                            if (typeof value === "number") this.nodeType = NodeTypeEnum.extractNodeTypeEnum(value);

                            return value;
                        },

                        position: 104,
                    },

                    /**
                     * Address contains protocol, address and port
                     */
                    address: {
                        type: "string",
                        default: "0.0.0.0:0",

                        /**
                         * Validate the address and use the normalized version
                         */
                        preprocessor (value , name ) {
                            this._ipAddress = ipAddress.create(value);
                            return this._ipAddress.toString();
                        },

                        position: 105,
                    },

                    seedNode:{

                        type: "boolean",

                        default: true,

                        skipMarshal: true,
                        skipSaving: false,

                        skipHashing: true,

                        position: 106,

                    },

                    /**
                     * Date of update
                     */
                    date: {
                        type: "number",

                        validation(date) {

                            if (this.seedNode) return true;

                            if ( !DBSchemaBuildNodeBase.validateNodeDate(date, this._scope ) )
                                throw new Exception(this, "Node Lifespan is invalid");

                            return true;
                        },

                        position: 107,

                    },

                    /**
                     * Score combines (latency, fails, successes)
                     * Score to sort the list by a feedback score
                     */
                    score: {

                        type: "number",
                        default: 1000,
                        maxSize: 1 << 16 - 1,

                        position: 108,
                    },

                    /**
                     * id is generated using the normalized ipAddress of the connection. Redis doesn't support the key ":"
                     */
                    id: {

                        default (){
                            return `${ this._ipAddress.toString().replace(/:/g, "+") }`;
                        },

                    },

                }

            },
            schema, true));
    }

    static validateNodeDate(date, scope){
        return Math.abs ( date - scope.argv.settings.getDateNow()  ) < scope.argv.networkSettings.networkNodeLifespan;
    }

}

module.exports = {
    DBSchemaBuildNodeBase,
    DBSchemaBuiltNodeBase: new DBSchemaBuildNodeBase(),
}