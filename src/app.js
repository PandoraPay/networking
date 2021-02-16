const {MasterCluster} = PandoraLibrary.masterCluster;

const Argv = require( "../bin/argv/argv" )

const Tests = require( '../tests/tests/tests-index');
const NetworkMasterCluster = require( "./cluster/network-master-cluster")

module.exports = class App extends PandoraLibrary.utils.App {

    setAdditionalEvents(){

        this.events.on("start/argv-set", () =>{

            if ( this._scope.MasterCluster === MasterCluster)
                this._scope.MasterCluster = NetworkMasterCluster;

            this._scope.argv = Argv(this._scope.argv);

        });

        this.events.on("start/tests-args-middleware", ()=>{

            this._scope.argv = Tests.argvTests(this._scope.argv);
            this._scope.tests.unshift( Tests.tests );

        });

        this.events.on("start/init-processed", () => {
            this._scope.logger.info(`Status`, `Network has been started`);
        });


    }

}

