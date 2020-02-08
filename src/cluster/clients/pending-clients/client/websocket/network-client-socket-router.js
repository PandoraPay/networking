const {Helper} = global.kernel.helpers;

import CommonSocketRouter from "src/sockets/protocol/common-socket-router";

export default class NetworkClientSocketRouter extends CommonSocketRouter{

    constructor(scope) {

        super({
            clientSocketRouterPlugins: [],
            ...scope
        });

        for (const routerPlugin of this._scope.clientSocketRouterPlugins)
            this.plugins.push( routerPlugin );

    }

    _initOneWayRoutes(){

        return {
            ...super._initOneWayRoutes.apply(this, arguments),
        }

    }

    _initTwoWaysRoutes(){

        let routes = {
            ...super._initTwoWaysRoutes.apply(this, arguments),
        };

        for (const socketRouterPlugin of this._scope.clientSocketRouterPlugins)
            routes = Helper.merge(routes, socketRouterPlugin.getTwoWaysRoutes(), false);

        return routes;

    }



    /**
     * One Way Middleware returns a straight-forward json answer from the request.
     * It call the request callback
     */
    async _oneWayMiddleware ( app, route, data, callback, method ){

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
    async _twoWaysMiddleware ( app, route, data, callback, method, apiType ){

        try {

            const out = await method(data, callback, data => this._notifySubscriberMiddleware(route, data, callback, app ), app );

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
    _notifySubscriberMiddleware(route, data, callback, socket){

        socket.emit(route+'/answer', data);

    }

}

