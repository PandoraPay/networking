const {describe} = require('kernel').tests;
const  {Helper} = require('kernel').helpers;
const {asyncTimeout} = require('kernel').helpers.AsyncInterval;

module.exports = function run (scope){

    describe("Network Master cluster", {

        'seed nodes': async function () {

            const masterCluster = await  this._scope.app.createMasterCluster( );

            await masterCluster.start();

            if ( masterCluster.isMaster ) { //master

                await Helper.waitUntilCondition( () => masterCluster.totalPeers.count === 2 *  this._scope.argv.masterCluster.workerCount , undefined, 55000 );

                await Helper.waitUntilCondition( () => masterCluster.stickyMaster.workers.length === 0 );

                await masterCluster.close();

            } else  { //slave

                await Helper.waitUntilCondition( () => masterCluster.totalPeers.count === 2 *  this._scope.argv.masterCluster.workerCount , undefined, 55000 );

                await Helper.sleep(5000);

                process.exit(1);

            }

        },

        'seed nodes again': async function () {

            const masterCluster = await  this._scope.app.createMasterCluster( );

            await masterCluster.start();

            if ( masterCluster.isMaster ) { //master

                await Helper.waitUntilCondition( () => masterCluster.totalPeers.count === 2 *  this._scope.argv.masterCluster.workerCount , undefined, 55000 );

                await Helper.waitUntilCondition( () => masterCluster.stickyMaster.workers.length === 0 );

                await masterCluster.close();

            } else  { //slave

                await Helper.waitUntilCondition( () => masterCluster.totalPeers.count === 2 *  this._scope.argv.masterCluster.workerCount , undefined, 55000 );

                await Helper.sleep(1000);

                process.exit(1);

            }

        },

    });

}
