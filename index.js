const kernel = global.kernel;

const BasicSocket = require("src/network/basic-socket").default;

const ServerSocket = BROWSER ? undefined : require('src/cluster/server/websocket/network-server-socket').default;
const ServerSocketRouter = BROWSER ? undefined : require('src/cluster/server/websocket/client/network-server-client-socket-router').default;
const NetworkServerCluster= BROWSER ? undefined : require("src/cluster/server/network-server-cluster").default;

const NetworkClientSocket = require('src/cluster/clients/pending-clients/client/websocket/network-client-socket').default;
const NetworkClientSocketRouter = require('src/cluster/clients/pending-clients/client/websocket/network-client-socket-router').default;
const PendingClients = require("src/cluster/clients/pending-clients/pending-clients").default;

const App = require('src/app').default;
const NetworkClientsCluster = require("src/cluster/clients/network-clients-cluster").default;
const NetworkMasterCluster = require("src/cluster/network-master-cluster").default;

const CommonSocketRouter = require("src/sockets/protocol/common-socket-router").default;
const CommonRpcRouter = require("src/sockets/protocol/common-rpc-router").default;
const SocketRouterPlugin = require("src/sockets/protocol/socket-router-plugin").default;
const TestsFiles = require("tests/tests/tests-index").default;

const client = require('socket.io-client');

const NodeConsensusTypeEnum = require("src/cluster/schemas/types/node-consensus-type-enum").default;
const NodeConnectionTypeEnum = require("src/cluster/schemas/types/node-connection-type-enum").default;
const TotalPeers = require("src/cluster/schemas/total-peers").default;
const KnownPeers = require("src/cluster/schemas/known-nodes").default;

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


export default library;