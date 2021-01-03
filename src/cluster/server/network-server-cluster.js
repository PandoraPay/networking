
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

	broadcastToSockets(name, data, senderSockets){

		if (!this.httpServer) return 0;

		return this.httpServer.broadcastToSockets(name, data, senderSockets) + this.serverSocket.broadcastToSockets(name, data, senderSockets);

	}

	async broadcastToSocketsAsync(name, data, timeout, senderSockets){
		if (!this.httpServer) return [];

		const out = await Promise.all([
			this.httpServer.broadcastToSocketsAsync(name, data, timeout, senderSockets),
			this.serverSocket.broadcastToSocketsAsync(name, data, timeout, senderSockets),
		]);

		return out[0].concat(out[1]);
	}

}

