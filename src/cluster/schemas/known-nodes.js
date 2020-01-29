import ConnectedNodeSchema from "../clients/pending-clients/schemas/connected-node-schema";
import ConnectingNodeSchema from "../clients/pending-clients/schemas/connecting-node-schema";

const {Helper} = global.kernel.helpers;
const {DBSchemaHelper} = global.kernel.marshal.db;

const  {setAsyncInterval, clearAsyncInterval} = global.kernel.helpers.AsyncInterval;

export default class KnownNodes {

    constructor(scope) {
        this._scope = scope;

        this._startedEvent = false;

        this.knownNodes = [];
        this.knownNodesRandom = [];

    }

    start(){

        if (this._startedEvent) return true;

        this._started();

        this._startedEvent = true;
    }

    _started(){
        //not necessary to use heart beat
        this._intervalGetKnownNodes = setAsyncInterval( this._generateNewKnownNodes.bind( this ) , 3*60*1000); // 3 min
        this._intervalKnownNodesRandom = setAsyncInterval( this._getKnownNodesRandom.bind( this ), 30*1000 );
    }

    async stop(){

        if (!this._started) return true;

        await this._stopped();

        this._started = false;

    }

    async _stopped(){
        await Promise.all([
            clearAsyncInterval(this._intervalGetKnownNodes),
            clearAsyncInterval(this._intervalKnownNodesRandom)
        ]);
    }

    /**
     * It should not expose score and date to avoid network analyses
     * @returns {Promise<void>}
     * @private
     */
    async _generateNewKnownNodes(){

        try{

            const connectedNodes =  await this._scope.db.findBySort( DBSchemaHelper.onlyProperties( ConnectedNodeSchema,  { id: true, table: true, score: true, address: true, build: true, node: true, consensus: true } ), "scoreClientsConsensus", 0, 1000,  );
            const connectingNodes = await this._scope.db.findBySort( DBSchemaHelper.onlyProperties( ConnectingNodeSchema, { id: true, table: true, score: true, address: true, build: true, node: true, consensus: true } ), "scoreClientsConsensus", 0, 1000,  );

            if (connectedNodes.length > 0 || connectingNodes.length > 0){

                //merge sorting
                const list = Helper.mergeSortedArrays( connectedNodes, connectingNodes, (a,b) => a.score < b.score );

                const final = [], addresses = {};

                const add = it => {

                    const data = it.getPublicInfo();
                    final.push( data );
                    addresses[ data.address ] = true;

                };

                const MINIMUM_VALUE = 100;
                list.map (  it => !addresses[it.address] && it.score > MINIMUM_VALUE ? add(it) : undefined );

                this.knownNodes = final;
                this._getKnownNodesRandom();

            }

        }catch(err){
            this._scope.logger.info(this, "Error retrieving publicList", err );
        }

    }

    _getKnownNodesRandom(count = 50){

        count = Math.min( count, this.knownNodes.length );
        const len = count / 2, list = [], included = {};

        for (let i=0; i < this.knownNodes.length && list.length < len; ++i)
            if (Math.random() < 0.3) {
                list.push(this.knownNodes[i]);
                included[i] = true;
            }


        for (let i=0; i < this.knownNodes.length && list.length < count; ++i) {

            const index = Math.floor( Math.random() * this.knownNodes.length );
            if (!included[index]) {
                list.push( this.knownNodes[i] );
                included[index] = true;
            }

        }

        this.knownNodesRandom = list;

    }



}