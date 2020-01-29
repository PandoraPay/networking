export default class SocketRouterPlugin {

    constructor(scope){
        this._scope = scope;
        this._startedStatus = false;

        this.clear();
    }

    clear(){

    }

    async start(){
        if (this._startedStatus) return true;
        this._startedStatus = true;

        try{
            await this._started();
        } catch(err){
            this._scope.logger.error(this, "Plugin raised an error starting", err);
            this._startedStatus = false;
        }
    }

    async _started(){

    }

    async stop(){
        if (!this._startedStatus) return true;
        await this._stopped();
        this._startedStatus = true;
    }

    async _stopped(){

    }

    getOneWayRoutes(){
        return {

        };
    }

    getTwoWaysRoutes(){
        return {

        };
    }

}