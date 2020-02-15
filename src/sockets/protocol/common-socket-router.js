const {Helper, Exception} = global.kernel.helpers;

import SocketsRouter from "../routes/socket-router"
import CommonRpcRouter from "./common-rpc-router";

import NodeConsensusTypeEnum from "src/cluster/schemas/types/node-consensus-type-enum"

export default class CommonSocketRouter extends SocketsRouter{

    constructor(scope){
        super({
            commonSocketRouterPlugins: [],
            JsonRpcRouter: CommonRpcRouter,
            ...scope,
        });

        for (const routerPlugin of this._scope.commonSocketRouterPlugins)
            this.plugins.push( routerPlugin );

        this._handshakeJSON = {};
        this._handshake = {};
        
    }

    _initOneWayRoutes(){

        return {

            ...super._initOneWayRoutes.apply(this, arguments),

            '': {
                handle:  this.home,
                maxCallsPerSecond:  50,
                descr: "Show the Status of the Node"
            },

            'stats': {
                handle:  this._stats,
                maxCallsPerSecond:  50,
                descr: "Show the Status of the Node"
            },

            'peers/info': !this._scope.argv.debug ? undefined : {
                handle: this._getAllNodes,
                maxCallsPerSecond: 5,
                descr: "List of all Peers",
            },

            'peers/known-nodes': {
                handle: this._getAllKnownNodes,
                maxCallsPerSecond: 5,
                descr: "List of all Known Nodes",
            },

            'peers/known-nodes-random': {
                handle: this._getAllKnownNodesRandom,
                maxCallsPerSecond: 20,
                descr: "List of all Peers",
            },

            'ping': {
                handle: this._ping,
                maxCallsPerSecond: 100,
                descr: "Ping Pong",
            },

        };

    }

    _initTwoWaysRoutes(){

        return {
            ...super._initTwoWaysRoutes.apply(this, arguments),
        };

    }

    _ping(){
        return {ping: "pong"};
    }

    home(){

        return {

            ... this._stats(),

            descr: this._scope.argv.settings.applicationDescription,

            net:{
                type: this._scope.argv.settings.networkType,
                peers: this._scope.masterCluster.totalPeers.count,
                client: this._scope.masterCluster.totalPeers.client,
                server: this._scope.masterCluster.totalPeers.server,
            },

        }

    }

    _stats( consensusType = this._scope.masterCluster.consensusType ){



        return {
            short: this._scope.argv.settings.applicationShort,

            build: this._scope.argv.settings.buildVersion,

            net: {
                type: this._scope.argv.settings.networkType,
            },

            address: this._scope.masterCluster.serverCluster.httpServer ? this._scope.masterCluster.serverCluster.httpServer.address : '',

            consensus: consensusType,

        };

    }

    _getAllNodes(){

        const clients = [];
        for (const clientSocket of this._scope.masterCluster.clientsCluster.list )
            clients.push( clientSocket.address.toString() );

        const server = [];
        for (const serverSocket of this._scope.masterCluster.serverCluster.serverSocket.list )
            server.push( serverSocket.address.toString() );

        return {
            clients: clients,
            server: server,
        };

    }

    _getAllKnownNodes(){
        return this._scope.masterCluster.knownNodes.knownNodes;
    }

    _getAllKnownNodesRandom(){
        return this._scope.masterCluster.knownNodes.knownNodesRandom;
    }

    handshake(consensusType){

        if (!this._handshake[consensusType])
            this._handshake[consensusType] = this._stats( consensusType );

        return this._handshake[consensusType];

    }

    handshakeJSON(consensusType){

        if ( !this._handshakeJSON[consensusType] )
            this._handshakeJSON[consensusType] = JSON.stringify( this.handshake(consensusType) );

        return this._handshakeJSON[consensusType];

    }

    handshakeValidate(handshake, remoteAddress){

        if (!handshake || typeof handshake !== "object") throw new Exception( this, "invalid handsake format" );

        if (handshake.short !== this._scope.argv.settings.applicationShort) throw new Exception( this, "invalid application short name", handshake.short);
        if ( !this._scope.argv.settings.versionCompatibility( handshake.build ) ) throw new Exception( this, "incompatible build version", handshake.build);
        if ( handshake.net.type !== this._scope.argv.settings.networkType) throw new Exception(this, "invalid network type", handshake.net.type );

        let addr = handshake.address || "";
        if (addr)
            addr = addr.replace("::", remoteAddress );

        const consensus = Number.parseInt(handshake.consensus) || NodeConsensusTypeEnum.CONSENSUS_NONE;

        return {
            version: handshake.build,
            networkType: parseInt(handshake.net.type),
            address: addr,
        };

    }

}

