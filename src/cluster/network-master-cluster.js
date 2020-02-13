
const {MasterCluster} = global.kernel.masterCluster;
const {Helper} = global.kernel.helpers;

const NetworkServerCluster = BROWSER ? undefined : require("./server/network-server-cluster").default;

import NetworkClientsCluster from "./clients/network-clients-cluster"
import TotalPeers from "./schemas/total-peers";
import KnownNodes from "./schemas/known-nodes";
import NodeConsensusTypeEnum from "src/cluster/schemas/types/node-consensus-type-enum"

export default class NetworkMasterCluster extends MasterCluster {

    constructor(scope){

        super(undefined, false);

        this.consensusType = NodeConsensusTypeEnum.CONSENSUS_FULL;

        /**
         * List using socket unique id
         */
        this.allSockets = { };
        this.allSocketsCount = 0;

        setInterval( ()=> this._scope.logger.log(this, "this.allSocketsCount", this.allSocketsCount), 1000);

        /**
         * Apply the rest of the constructor
         *
         */
        this._constructor( {
            ClientsCluster: NetworkClientsCluster,
            ServerCluster: NetworkServerCluster,
            ...scope,
        });

        /**
         * Create Total Peers
         */
        this.totalPeers = new TotalPeers({
            ...this._scope,
            masterCluster: this,
        });

        /**
         * Create Public List
         */
        this.knownNodes = new  KnownNodes({
            ...this._scope,
            masterCluster: this,
        });


    }

    async _started(){


        // setInterval( ()=>{
        //     if (this.isMaster) {
        //         console.log("DEBUG");
        //     }
        // }, 1000)

        await this.totalPeers.start();

        await super._started.call(this);

        await this.knownNodes.start();

    }

    async _closed (){

        return Promise.all( [
            super._closed.call(this),
            this.totalPeers.stop(),
            this.knownNodes.stop(),
        ]);

    }

    includeSocket(socket){

        if (!this.allSockets[socket.id]) {
            this.allSockets[socket.id] = socket;
            this.allSocketsCount++;

            if (!socket.__includeSocketInitialized) {
                socket.__includeSocketInitialized = true;
                socket.once("disconnect", () => {
                    this.removeSocket(socket);
                });
            }

        }

    }

    removeSocket(socket){

        if (this.allSockets[socket.id]) {
            delete this.allSockets[socket.id];
            this.allSocketsCount--;
        }

    }

    broadcast(name, data, senderSockets = {}){

        if ( Array.isArray(senderSockets)  ) {
            const hashMap = {};
            senderSockets.map( it => hashMap[ typeof it === "string" ? it : it.address.toString() ] = true );
            senderSockets = hashMap;
        }

        let clients = 0, server = 0;
        if (this.clientsCluster)
            clients = this.clientsCluster.broadcast(name, data, senderSockets);

        if (this.serverCluster)
            server = this.serverCluster.broadcast(name, data, senderSockets);

        return clients + server;

    }

}

