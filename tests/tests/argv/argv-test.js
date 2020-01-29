import ArgvMasterCluster from "./modules/master-cluster/argv-master-cluster";
import ArgvBansManager from "./modules/bans-manager/argv-bans-manager";

const {Helper} = global.kernel.helpers;

export default argv => Helper.merge( argv, {

    masterCluster: ArgvMasterCluster,
    bansManager: ArgvBansManager,

})