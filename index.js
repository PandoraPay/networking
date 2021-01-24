const kernel = require('kernel');

const BasicSocket = require("./src/network/basic-socket");

const ServerSocket = BROWSER ? undefined : require('./src/cluster/server/websocket/network-server-socket');
const ServerSocketRouter = BROWSER ? undefined : require('./src/cluster/server/websocket/client/network-server-client-socket-router');
const NetworkServerCluster= BROWSER ? undefined : require("./src/cluster/server/network-server-cluster");

const NetworkClientSocket = require('./src/cluster/clients/pending-clients/client/websocket/network-client-socket');
const NetworkClientSocketRouter = require('./src/cluster/clients/pending-clients/client/websocket/network-client-socket-router');
const PendingClients = require("./src/cluster/clients/pending-clients/pending-clients");

const App = require('./src/app');
const NetworkClientsCluster = require("./src/cluster/clients/network-clients-cluster");
const NetworkMasterCluster = require("./src/cluster/network-master-cluster");

const CommonSocketRouter = require("./src/sockets/protocol/common-socket-router");
const CommonRpcRouter = require("./src/sockets/protocol/common-rpc-router");
const SocketRouterPlugin = require("./src/sockets/protocol/socket-router-plugin");
const TestsFiles = require("./tests/tests/tests-index");

const client = require('socket.io-client');

const NodeConsensusTypeEnum = require("./src/cluster/schemas/types/node-consensus-type-enum");
const NodeConnectionTypeEnum = require("./src/cluster/schemas/types/node-connection-type-enum");
const TotalPeers = require("./src/cluster/schemas/total-peers");
const KnownPeers = require("./src/cluster/schemas/known-nodes");

const library = {

    ...kernel,

    app: new App({}),

    masterCluster: {
        MasterCluster: NetworkMasterCluster,
        ServerCluster: NetworkServerCluster,
        ClientsCluster: NetworkClientsCluster,
    },

    sockets:{

        client:{

            ClientSocket: NetworkClientSocket,
            ClientSocketRouter: NetworkClientSocketRouter,

            PendingClients: PendingClients,

            client,

        },
        server:{

            ServerSocket,
            ServerSocketRouter,

        },

        basic: {
            BasicSocket,
        },

        protocol : {
            CommonSocketRouter,
            CommonRpcRouter,
            SocketRouterPlugin,
        },

        schemas: {

            types: {
                NodeConnectionTypeEnum,
                NodeConsensusTypeEnum,
            },

            KnownPeers,
            TotalPeers,

        },

    },

    utils: {
        ...kernel.utils,
        App: App,
    },

    tests: {
        ...kernel.tests,
        TestsFiles,
    }

};



if (typeof window !== "undefined") {
    window.library = library;
    window.PandoraPay = window.app = library.app;
    global.networking = library;
}

if (typeof global !== "undefined"){
    global.library = library;
    global.PandoraPay = global.app = library.app;
    global.networking = library;
}

module.exports = library;