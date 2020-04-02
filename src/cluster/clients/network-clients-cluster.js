import PendingClients from "./pending-clients/pending-clients";


const {ClientsCluster} = global.kernel.masterCluster;
const { Helper, Exception } = global.kernel.helpers;

export default class NetworkClientsCluster extends ClientsCluster {
	
	constructor(scope)	{

		super();

		this._scope = scope = {
			PendingClients: PendingClients,
			...scope,
		};

		this.pendingClients = new scope.PendingClients({
			...scope,
			clientsCluster: this,
		});

		/**
		 * list of all sockets
		 */
		this.list = {};
		this.listCount = 0;

		/**
		 * list of all sockets based on IP only to keep track of number of connected server sockets
		 */
		this._uniqueList = {};

	}

	async init(){

		if (this._init) return true;
		this._init = true;

		await this.pendingClients.init();

		this.emit("initialized");

	}

	async _started(){

		await this.pendingClients.start();

	}

	async _closed(){

		for (const key in this.list)
            this.list[key].disconnect();

		await this.pendingClients.close();

	}

	async clientSocketConnected(nodeQueue, clientSocket){

		let address, addressUnique;

		try{


			//in debug, local ips are allowed to be connected
			if ( !this._scope.argv.debug.enabled && clientSocket.address.isLocalIp() )
				throw new Exception(this, "ip is local");

			/**
			 * checking if there is a duplicate connection
			 */
			address = clientSocket.address.toString( false, false, false);

			if (this.list[address])
				throw new Exception(this, "client already connected");

			this.list[address] = clientSocket;
			this.listCount++;

			/**
			 * check address unique
			 */
			addressUnique = clientSocket.address.toString( false, false, false );
			if ( this._uniqueList[addressUnique] >= this._scope.argv.masterCluster.serverCluster.serverSocket.maximumIdenticalIps ){
				addressUnique = "";
				throw new Exception(this, "maximum identical IPs has exceeded", addressUnique);
			}

			if ( !this._uniqueList[addressUnique] ) this._uniqueList[addressUnique] = 0;
			this._uniqueList[addressUnique] ++;


			/**
			 *  Store the socket unique id
			 */
			this._scope.masterCluster.includeSocket( clientSocket );

			/**
			 * let's add it to the connected-node-schema
			 * It will also automatically store it in the databse
			 */
			nodeQueue.score += 5;
			nodeQueue.client += clientSocket;

			const connectedNode = nodeQueue.createConnectedNode( clientSocket );

			await connectedNode.save();

			await nodeQueue.delete();

			/**
			 * Inserting the clientSocket into connected list
			 */
			this._scope.masterCluster.totalPeers.updatePeers(+1, 0);

			clientSocket.on("disconnect", ()=>{

				if (this.list[address]){
					delete this.list[address];
					this._scope.masterCluster.totalPeers.updatePeers(-1, 0 );
				}

				this._scope.logger.info(this, "Client Socket Disconnected", clientSocket.address.toString() );

			});

			this._scope.logger.info(this, "Client Socket Connected", clientSocket.address.toString() );

		} catch (err){

			if (address && this.list[address] === clientSocket ) {
				delete this.list[address];
				this.listCount--;
			}

			if (addressUnique) {
				this._uniqueList[addressUnique]--;
				if (!this._uniqueList[addressUnique]) delete this._uniqueList[addressUnique];
			}

			if (clientSocket)
				this._scope.masterCluster.removeSocket(clientSocket);

			//this._scope.logger.error(this, `Client Socket Recently Disconnected ${clientSocket.address.toString()}`, err );

			clientSocket.disconnect();
			return false;

		}

		return true;

	}

	broadcast(name, data, senderSockets = {}){

		//this._scope.logger.log(this, "broadcasting to: " + this.listCount + " clients");

		for (const address in this.list)
			if (!senderSockets[this.list[address].id])
				this.list[address].emit(name, data);

		return this.listCount;

	}

	async broadcastAsync(name, data, timeout, senderSockets = {}){

		let array = [];

		for (const address in this.list)
			if (!senderSockets[this.list[address].id])
				array.push( this.list[address].emitAsync(name, data, timeout) );

		array = await Promise.all(array);

		const out = [];
		for (let i=0; i < array.length; i++) array[i] = out[i];

		return out;
	}

}

