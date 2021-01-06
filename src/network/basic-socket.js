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

        if (!newSocket || this._socket === newSocket ) return;

        this._socket = newSocket;
    }

    socketInitialized(){

        if (this._socket.disconnected) return false;

        this._socket.additional = {
            timeOpen: new Date().getTime(),
        };


        this._scope.logger.warn(this, "socketInitialized connected");

        this._socket.once("disconnect", ()=>{

            this._scope.logger.warn(this, "socketInitialized disconnected");

            if (this.handshake) {
                this._clearSubscriptions();
                this._scope.events.emit('sockets/disconnected', {socket: this});
            }

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

        if ( this.disconnected  ) return;

        let resolver, timeoutId;

        const promise = new Promise( resolve => {
            resolver = resolve;
            this.emit(route, data, (out, cb) => {
                clearTimeout(timeoutId);
                resolve( out, cb )
            } );
        } );

        if (timeout)
            timeoutId = setTimeout(() => resolver(), timeout);

        // Returns a race between our timeout and the passed in promise
        return Promise.race([
            promise,
        ]);
    }

    onceAsync(route, timeout = this._scope.argv.networkSettings.networkTimeout){

        if ( this.disconnected ) return;

        let resolver, timeoutId;
        const promise = new Promise ( resolve => {
            resolver = resolve;
            this.once(route, (data, cb ) => {
                clearTimeout(timeoutId);
                resolve ( data, cb)
            } )
        } );

        if (timeout)
            timeoutId = setTimeout(() => resolver(), timeout);

        return Promise.race([
            promise,
        ]);
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