const {Helper} = global.kernel.helpers;

import CommonSocketRouter from "src/sockets/protocol/common-socket-router";

export default class NetworkServerClientSocketRouter extends CommonSocketRouter{

    constructor(scope) {
        super({
            serverClientSocketRouterPlugins: [],
            ...scope
        });

        for (const routerPlugin of this._scope.serverClientSocketRouterPlugins)
            this.plugins.push( routerPlugin );

    }

    _initOneWayRoutes(){

        return {
            ...super._initOneWayRoutes.apply(this, arguments),
        }

    }

    _initTwoWaysRoutes(){

        return {
            ...super._initOneWayRoutes.apply(this, arguments),
        }

    }

    /**
     * One Way Middleware returns a straight-forward json answer from the request.
     * It call the request callback
     */
    async _oneWayMiddleware (app, route, data, callback, method){

        try {

            const out =  await method(data, callback, app);

            if (callback)
                callback(out);

        } catch (err){

            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, `${route} raised an error`, err );

            return {result:false, error: err.message};

        }

    }

    /**
     * Two Way Middleware returns a json from the request and it subscribes to an event.
     * It call the request callback and subscribe for notification
     */
    async _twoWaysMiddleware (app, route, data, callback, method, socket){

        try {


            const out = await method(data, callback, data => this._notifySubscriberMiddleware( route, data, callback ), app );

            if (callback)
                callback(out);

        } catch (err){

            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, `${route} raised an error`, err );

            return {result:false, error: err.message};
        }

    }

    /**
     * Method that pushes notifications to the subscribers
     */
    _notifySubscriberMiddleware(route, data, callback){

        callback.emit(route+'/answer', data);

    }

}

