const ArgvTest = require( "./argv/argv-test")

const TestNetworkMasterCluster = require( "./tests-files/cluster/test-network-master-cluster")
const TestIpAddress = require("./tests-files/network/test-ip-address")

module.exports = {

    argvTests: ArgvTest,
    tests: async scope =>{

        scope.logger.info(`Tests`, `Running Network tests`);

        await TestIpAddress(  );
        await TestNetworkMasterCluster( );

    }

}
