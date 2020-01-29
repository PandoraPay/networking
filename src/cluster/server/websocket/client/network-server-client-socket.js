import ipAddress from "src/network/ip-address";
import BasicSocket from "src/network/basic-socket";

export default class NetworkServerClientSocket extends  BasicSocket {

    constructor(scope, address, socket, handshake){

        super(scope, address, socket, handshake);

        [  "disconnect"].map( fct => this[fct] = socket[fct].bind(socket) );
        [  "request" ].map( fct => this[fct] = socket[fct] );
        [ "emit", "on","once" ].map( fct => this['_'+fct] = socket[fct].bind(socket) );

        this.address =  ipAddress.create( undefined, this.request.connection.remoteAddress, this.request.connection.remotePort );

        if (this.handshake.address)
            this.serverAddress = ipAddress.create( this.handshake.address );

    }

}


