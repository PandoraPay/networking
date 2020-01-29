const {Exception, BufferHelper } = global.kernel.helpers;

import CommonSocketRouter from "../../../sockets/protocol/common-socket-router";

export default class NetworkHttpServerRouter extends CommonSocketRouter{

    constructor(scope) {
        super({
            httpServerRouterPlugins: [],
            ...scope
        });

        for (const routerPlugin of this._scope.httpServerRouterPlugins)
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
     * It processes the httpServer params in order to decode the URI and call the request callback
     */
    async _oneWayMiddleware( app, route, req, res, method){

        try {

            const out = await method( this._processReqParams ( req ), res, app);
            res.json( BufferHelper.convertAllBuffersToHex(out) );

        } catch (err){

            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, `${route} raised an error`, err );

            res.json( {result:false, error: err.message} );
        }

    }

    /**
     * Two Way Middleware returns a json from the request and it subscribes to an event.
     * It processes the httpServer params in order to decode the URI and call the request callback
     */
    async _twoWaysMiddleware( app, route, req, res, method ){

        try {

            const params =  this._processReqParams ( req );

            const url = params.url;
            if (typeof url !== "string" || url.length === 0) throw {message: "url not specified"};

            const out = await method( params, res, data => this._notifySubscriberMiddleware(url, data), app );
            res.json ( BufferHelper.convertAllBuffersToHex(out) );

        } catch (err){
            res.json( {result:false, error: err.message} );
        }

    }

    /**
     * Method that pushes notifications to the subscribers
     */
    _notifySubscriberMiddleware(url, data){

        if (!url) return;

    }

    _processReqParams(req){

        const params = req.method === "POST" ?  req.body : req.query ;
        for (const it in params )
            if (params.hasOwnProperty(it) && params[it] !== undefined)
                params[it] = decodeURIComponent( params[it] );

        return params;
    }

}

