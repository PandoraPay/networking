
const {ServerCluster} = global.kernel.masterCluster;

import NetworkHttpServer from "./http-server/network-http-server";
import NetworkServerSocket from "./websocket/network-server-socket";

/**
 * scope
 *          argv, logger, db, masterCluster
 */

export default class NetworkServerCluster extends ServerCluster {

	constructor(scope)	{

		super(scope);

        this._scope =  {
			...scope,
			HttpServer: NetworkHttpServer,
			ServerSocket: NetworkServerSocket,
		};

	}

	broadcast(name, data, senderSockets){

		if (!this.httpServer) return 0;

		return this.httpServer.broadcast(name, data, senderSockets) + this.serverSocket.broadcast(name, data, senderSockets);

	}


}

