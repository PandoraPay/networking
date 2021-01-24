const JsonRpcRouter = require( "../routes/json-rpc-router" )

const {CryptoHelper} = require('kernel').helpers.crypto;
const {Helper} = require('kernel').helpers;

module.exports = class CommonJsonRpcRouter extends JsonRpcRouter{

    _initJsonRpcRoutes(){
        return {

            ...super._initJsonRpcRoutes.call(this),

            "web3_clientVersion": {
                handle: this._web3_clientVersion,
                maxCallsPerSecond: 100,
                descr: "version app"
            },
            "web3_sha3": {
                handle: this._web3_sha3,
                maxCallsPerSecond: 30,
                descr: "sha3"
            },
            "net_version": {
                handle: this._net_version,
                maxCallsPerSecond: 100,
                descr: "network version"
            },
            "net_listening": {
                handle: this._net_listening,
                maxCallsPerSecond: 100,
                descr: "network status"
            },
            "net_peerCount": {
                handle: this._net_peerCount,
                maxCallsPerSecond: 100,
                descr: "peers count"
            },
            "net_clientCount": {
                handle: this._net_clientCount,
                maxCallsPerSecond: 100,
                descr: "client count"
            },
            "net_serverCount": {
                handle: this._net_serverCount,
                maxCallsPerSecond: 100,
                descr: "client count"
            },
            "get_version": {
                handle: this._get_version,
                maxCallsPerSecond: 100,
                descr: "get version as 32 bit integer"
            },
            "_protocolVersion": {
                handle: this._protocolVersion,
                maxCallsPerSecond: 100,
                descr: "protocol version"
            },
            "_syncing": {
                handle: this._syncing(),
                maxCallsPerSecond: 100,
                descr: "protocol syncing"
            },
            "_mining": {
                handle: this._mining(),
                maxCallsPerSecond: 100,
                descr: "check if it is mining"
            }
        }
    }

    /**
     * return the version of the app. It doesn't expose the operating system and Node.js version to avoid possible exploits
     * @returns {string}
     * @private
     */
    _web3_clientVersion(){

        return `${this._scope.argv.settings.applicationName}/${this._scope.argv.settings.buildVersion}/NO_OS_SUPPLIED/NO_VERSION_SUPPLIED`;

    }

    /**
     * Returns Keccak-256 (not the standardized SHA3-256) of the given data.
     * @param params
     * @returns {string}
     * @private
     */
    _web3_sha3(params){

        return "0x" + CryptoHelper.keccak256( Buffer.from( params[0], "hex") );

    }

    /**
     * Returns the current network id.
     * @returns {*}
     * @private
     */
    _net_version(){

        return this._scope.argv.settings.networkType.toString();

    }

    /**
     * Returns true if client is actively listening for network connections.
     * @returns {*}
     * @private
     */
    _net_listening(){

        if ( !this._scope.masterCluster ) return false;
        if ( !this._scope.masterCluster.serverCluster ) return false;
        if ( !this._scope.masterCluster.serverCluster.httpServer ) return false;

        return this._scope.masterCluster.serverCluster.httpServer.started;
    }


    /**
     * Returns number of peers currently connected.
     * @returns {*}
     * @private
     */
    _net_peerCount(){
        return this._scope.masterCluster.totalPeers.count;
    }

    /**
     * Returns number of clients currently connected.
     * @returns {*}
     * @private
     */
    _net_clientCount(){
        return this._scope.masterCluster.totalPeers.client;
    }

    /**
     * Returns number of server sockets currently connected.
     * @returns {*}
     * @private
     */
    _net_serverCount(){
        return this._scope.masterCluster.totalPeers.server;
    }

    _get_version(){

        return Helper.encodeVersion( this._scope.argv.settings.buildVersion );
    }

    /**
     * Returns the current ethereum protocol version.
     * @returns {string}
     * @private
     */
    _protocolVersion(){
        return '';
    }

    /**
     * Returns an object with data about the sync status or false.
     * @returns {string}
     * @private
     */
    _syncing(){
        return {
            startingBlock: '',
            currentBlock: '',
            highestBlock: '',
        };
    }

    /**
     * Returns true if client is actively mining new blocks.
     * @private
     */
    _mining(){
        return false;
    }

}

