const {cluster} = PandoraLibrary.masterCluster;

module.exports = {

    _initArgv( parents ){

        try{

            const parentCluster = parents[0].masterCluster;

            this.bans.client = {};

            if (cluster.isMaster){

                for (let i=0; i <= parentCluster.workerCount; i++)
                    if ( i !== 1)
                        this.bans.client [ `${parentCluster.serverCluster.serverSocket.protocol}${parentCluster.serverCluster.httpServer.sslUse ? 's' : ''}://127.0.0.1:${parentCluster.serverCluster.httpServer.port + i }` ] = true;

            } else {

                for (let i=0; i <= parentCluster.workerCount; i++) {

                    //slaveIndex is string
                    if ( Number.parseInt(process.env.SLAVE_INDEX) !== i + 1  )
                        continue;

                    this.bans.client [ `${parentCluster.serverCluster.serverSocket.protocol}${parentCluster.serverCluster.httpServer.sslUse ? 's' : ''}://127.0.0.1:${parentCluster.serverCluster.httpServer.port + i }` ] = true;
                }

            }

            // console.log( process.env.SLAVE_INDEX, this.bans );

        }catch(err){
            console.error("ArgvBansManager _initArgv raised an error ", err);
        }


    }

}