import ipAddress from "./ip-address";
const {Exception, BufferHelper} = global.kernel.helpers;

export default class BasicSocket {

    constructor(scope, address, socket, handshake){

        this._scope = {
            ...scope,
        };

        this.address = address;
        this.handshake = handshake;

        this._subscriptions = {
            _count: 0,
        };

        this.socket = socket;
    }

    set socket(newSocket){

        if (!newSocket) return;

        this._socket = newSocket;
        this._socketInitialized();
    }

    _socketInitialized(){

        this._socket.additional = {
            timeOpen: new Date().getTime(),
        };

        this.disconnectedPromise = new Promise( resolve =>  this._socket.once("disconnect", () => resolve( ) ) );

        this._socket.once("disconnect", ()=>{

            this._clearSubscriptions();

            this._scope.events.emit('sockets/disconnected', { socket: this } );

        });
    }

    get connected(){
        return this._socket.connected;
    }

    get disconnected(){
        return this._socket.disconnected;
    }

    get id(){
        return this._socket.id;
    }

    on(route, cbOriginal ){
        return this._on( route, (data, cb) => cbOriginal(  BROWSER ? BufferHelper.processBufferArray(data) : data, cb ) );
    }

    once(route, cbOriginal){
        return this._once( route, (data, cb) => cbOriginal(  BROWSER ? BufferHelper.processBufferArray(data) : data, cb ) );
    }

    emit(route, data, cbOriginal){
        return this._emit( route, data, (out, cb) => cbOriginal ? cbOriginal(  BROWSER ? BufferHelper.processBufferArray(out) : out, cb ) : undefined );
    }

    emitAsync(route, data, timeout = this._scope.argv.networkSettings.networkTimeout ){

        if ( this.disconnected ) return;

        const race = [
            new Promise( resolve => this.emit(route, data, (out, cb) =>  resolve( out, cb ) ) ),
            this.disconnectedPromise
        ];

        if (timeout)
            race.push(new Promise(resolve => setTimeout(() => resolve(), timeout)));

        // Returns a race between our timeout and the passed in promise
        return Promise.race( race );
    }

    onceAsync(route, timeout = this._scope.argv.networkSettings.networkTimeout){

        const race = [
            new Promise ( resolve => this.once(route, (data, cb ) => resolve ( data, cb) ) ),
            this.disconnectedPromise
        ];

        if (timeout)
            race.push(new Promise(resolve => setTimeout(() => resolve(), timeout)));

        // Returns a race between our timeout and the passed in promise
        return Promise.race( race );
    }

    onAsync(route, timeout = this._scope.argv.networkSettings.networkTimeout){

        const race = [
            new Promise ( resolve => this.on(route, (data, cb ) => resolve ( data, cb) ) ),
            this.disconnectedPromise,
        ];

        if (timeout)
            race.push(new Promise(resolve => setTimeout(() => resolve(), timeout)));


        // Returns a race between our timeout and the passed in promise
        return Promise.race( race );
    }

    subscribe(route, cb){

        if (this._subscriptions._count > 50) throw new Exception(this, "Too many subscriptions", {count: this._subscriptions._count});
        if (this._subscriptions[route]) throw new Exception(this, "Route already subscribed", {route});

        this._subscriptions._count = (this._subscriptions._count || 0) + 1;

        this._subscriptions[route] = this._scope.events.on(`subscriptions/${route}`, cb );
    }

    _clearSubscriptions(){

        for (const key in this._subscriptions)
            if (key !== "_count"){
                const off = this._subscriptions[key];
                off();
            }

        this._subscriptions = {};

    }

}