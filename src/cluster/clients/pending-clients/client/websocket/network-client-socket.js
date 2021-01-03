const {Exception, Helper } = global.kernel.helpers;

import client from 'socket.io-client';

import ipAddress from "src/network/ip-address";
import BasicSocket from "src/network/basic-socket";

//TODO extend socket.io client function using es6 class

export default class NetworkClientSocket extends BasicSocket {

    connectAsync (address) {

        if (address)
            this.address = ipAddress.create(address);

        return new Promise(async (resolve, reject)=>{

            const timeoutFail = setTimeout(  () => {

                if (this.handshake) resolve(true);
                else reject("timeout" );

            }, this._scope.argv.masterCluster.clientsCluster.pendingClients.timeoutConnection );

            //disconnect the previous
            if (this._socket)
                this._socket.disconnect();

            this.socket = client( this.address.toString(), {

                reconnection: false,
                maxHttpBufferSize: this._scope.argv.networkSettings.networkMaxSize,

                secure: this.address.secured,
                query: {
                    handshake :this._scope.clientSocketRouter.handshakeJSON( this._scope.masterCluster.consensusType ),
                },

                timeout: this._scope.argv.networkSettings.networkTimeoutHeartbeat,

            } );

            [ "connect", "disconnect" ].map( fct => this[fct] = this._socket[fct].bind(this._socket) );
            [ "on","once","emit" ].map( fct => this['_'+fct] = this._socket[fct].bind(this._socket) );

            this.on("connect", () => {

            });

            this.once("other-nodes", data => {

                if (data && Array.isArray(data) && this._scope.masterCluster)
                    data.map( it => this._scope.masterCluster.clientsCluster.pendingClients.addNodeToPendingQueue( it, false) );

            });

            this.once("handshake", handshake =>{

                handshake = this._scope.clientSocketRouter.handshakeValidate( handshake, this.address.toString(false, false, false) );
                clearTimeout(timeoutFail)

                if (!handshake) {
                    this._socket.disconnect();
                    return reject("Handshake is invalid");
                }

                handshake.address = this.address.toString();
                this.handshake = handshake;

                this.serverAddress = ipAddress.create( handshake.address );

                this.socketInitialized();

                resolve(true);

            });

        });


    }




}