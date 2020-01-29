const kernel = global.kernel;
const {MasterCluster} = global.kernel.masterCluster;

import Argv from "bin/argv/argv"

import Tests from 'tests/tests/tests-index';
import NetworkMasterCluster from "./cluster/network-master-cluster"

export default class App extends kernel.utils.App {

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

