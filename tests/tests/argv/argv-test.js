const ArgvMasterCluster = require( "./modules/master-cluster/argv-master-cluster");
const ArgvBansManager = require("./modules/bans-manager/argv-bans-manager");

const {Helper} = require('kernel').helpers;

module.exports = argv => Helper.merge( argv, {

    masterCluster: ArgvMasterCluster,
    bansManager: ArgvBansManager,

})