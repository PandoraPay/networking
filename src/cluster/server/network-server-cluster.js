
const {ServerCluster} = require('kernel').masterCluster;

const NetworkHttpServer = require("./http-server/network-http-server");
const NetworkServerSocket = require("./websocket/network-server-socket");

/**
 * scope
 *          argv, logger, db, masterCluster
 */

module.exports = class NetworkServerCluster extends ServerCluster {

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

	async broadcastToSocketsAsync(name, data, timeout, senderSockets, filter){

		if (!this.httpServer) return [];

		const out = await Promise.all([
			this.httpServer.broadcastToSocketsAsync(name, data, timeout, senderSockets, filter),
			this.serverSocket.broadcastToSocketsAsync(name, data, timeout, senderSockets, filter),
		]);

		return out[0].concat(out[1]);
	}

}

