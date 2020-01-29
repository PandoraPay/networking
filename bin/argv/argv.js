const {Helper} = global.kernel.helpers;

import ArgvMasterCluster from "./modules/master-cluster/argv-master-cluster";
import ArgvNetworkSettings from "./modules/network-settings/argv-network-settings"

/**
 * Network Routing Argv
 */

export default (argv) => Helper.merge( argv, {

    masterCluster: ArgvMasterCluster,

    networkSettings: ArgvNetworkSettings,

});