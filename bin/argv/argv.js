const {Helper} = require('kernel').helpers;

const ArgvMasterCluster = require( "./modules/master-cluster/argv-master-cluster");
const ArgvNetworkSettings = require("./modules/network-settings/argv-network-settings")

/**
 * Network Routing Argv
 */

module.exports = (argv) => Helper.merge( argv, {

    masterCluster: ArgvMasterCluster,

    networkSettings: ArgvNetworkSettings,

});