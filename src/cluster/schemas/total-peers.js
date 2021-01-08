const {DBSchema} = global.kernel.marshal.db;
const {Helper} = global.kernel.helpers;
const {Exception} = global.kernel.helpers;

export default class TotalPeers extends DBSchema{

    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge( {

                fields:{

                    table: {
                        default: "network",
                        fixedBytes: 7,
                    },

                    id: {
                        default: "TotalPeers",
                        fixedBytes: 10,
                    },

                    count: {
                        type: "number",
                        position: 100,
                    },

                    client: {
                        type: "number",
                        position: 101,
                    },

                    server: {
                        type: "number",
                        position: 102,
                    }

                }

            },
            schema, false), data, type, creationOptions);

    }

    async start(){

        await this.subscribe();

        this.subscription.on( message => {

            if (message.except && message.except === this._scope.masterCluster.workerName) return;

            if (message.name === "update-client")
                this.client += message.count;
            else
            if (message.name === "update-server")
                this.server += message.count;

            if (message.name === "update-client" || message.name === "update-server" )
                this.count += message.count;

        });

        try{

            if (this._scope.masterCluster.isMaster)
                await this.delete();

        } catch (err){

        }

    }

    stop (){

    }

    async updatePeers(client=1, server = 0){

        if (!client && !server) return false;
        if ( client === server) return false;


        //acquire lock
        const lock = await this.lock( );

        if (!lock) throw new Exception(this, "lock was not acquired");

        //lock acquired
        try {

            this.count += client + server;
            this.client += client;
            this.server += server;

            if (this.count > 0 && this.client > 0 && this.server > 0)
                await this.save();

            await this.subscription.emit({
                name: client ? "update-client" : "update-server",
                count: client ? client : server,
                except: this._scope.masterCluster.workerName,
            });

        } catch (err){
            this._scope.logger.error(this, err);
        }

        if (typeof lock === "function") await lock(); // release lock

        return true;
    }

}

