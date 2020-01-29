import ArgvTest from "./argv/argv-test"

import TestNetworkMasterCluster from "./tests-files/cluster/test-network-master-cluster"
import TestIpAddress from "./tests-files/network/test-ip-address"

export default {

    argvTests: ArgvTest,
    tests: async scope =>{

        scope.logger.info(`Tests`, `Running Network tests`);

        await TestIpAddress(  );
        await TestNetworkMasterCluster( );

    }

}
