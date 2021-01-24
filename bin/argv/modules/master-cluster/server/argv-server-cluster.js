const ArgvHttpServerCluster = require( "./modules/argv-http-server-cluster");
const ArgvServerSocketCluster = require("./modules/argv-server-socket-cluster");

/**
 * Arguments for Server Cluster
 */

module.exports = {
	
	httpServer: ArgvHttpServerCluster,
	serverSocket: ArgvServerSocketCluster,

}