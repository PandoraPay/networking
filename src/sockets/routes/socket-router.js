/**
 * scope:
 *          argv, logger, socketsRoutesGuardian
 */

import RoutesGuardian from "./guardian/routes-guardian";
import JsonRpcRouter from "./json-rpc-router";
const {Helper} = global.kernel.helpers;

export default class SocketRouter {

    constructor(scope){

        this._scope = scope = {
            RoutesGuardian: RoutesGuardian,
            JsonRpcRouter: JsonRpcRouter,
            socketRouterPlugins: [],
            ...scope,
        };

        this.plugins = [];

        if (!this._scope.routesGuardian)
            this._routesGuardian = new scope.RoutesGuardian(this._scope);

        if (!this._scope.jsonRpcRouter)
            this._jsonRpcRouter = new scope.JsonRpcRouter(this._scope);

        this._routesList = [];

        for (const socketRouterPlugin of this._scope.socketRouterPlugins)
            this.plugins.push( socketRouterPlugin );

    }

    _newRoute (app, get, route, callback, maxCallsPerSecond, middleware, affix='', apiType='') {

        get( affix + route, (req, res) => this._routesGuardian.guardRoute( route, () => middleware( app, affix + route, req, res, callback, apiType ) ) );

        /**
         * init route guard
         */

        this._routesGuardian.initRouteGuard( route, maxCallsPerSecond );

    };


    initRoutes(app, get, middleWareOneWay, middleWareTwoWays, affix, apiType){

        /**
         * One Way Routes
         */
        const list = this._initOneWayRoutes();
        for (const it in list ){

            this._newRoute(app, get, it, list[it].handle.bind(this), list[it].maxCallsPerSecond, middleWareOneWay || this._oneWayMiddleware.bind(this), affix, apiType);

            this._routesList[it] = {
                descr: list[it].descr,
                route: it,
            };

        }

        for (const socketRouterPlugin of this.plugins){

            const list = socketRouterPlugin.getOneWayRoutes();
            for (const it in list ) {

                this._newRoute(app, get, it, list[it].handle.bind(socketRouterPlugin), list[it].maxCallsPerSecond, middleWareOneWay || this._oneWayMiddleware.bind(this), affix, apiType);

                this._routesList[it] = {
                    descr: list[it].descr,
                    route: it,
                };
            }

        }

        /**
         * Two Ways Routes
         */

        const list2 = this._initTwoWaysRoutes();
        for (const it in list2){

            this._newRoute(app, get, it, list[it].handle.bind(this), list[it].maxCallsPerSecond, middleWareTwoWays || this._twoWaysMiddleware.bind(this), affix, apiType);

            this._routesList[it] = {
                descr: list[it].descr,
                route: it,
            };

        }

        for (const socketRouterPlugin of this.plugins){

            const list = socketRouterPlugin.getTwoWaysRoutes();

            for (const it in list ) {
                this._newRoute(app, get, it, list[it].handle.bind(socketRouterPlugin), list[it].maxCallsPerSecond, middleWareTwoWays || this._twoWaysMiddleware.bind(this), affix, apiType);

                this._routesList[it] = {
                    descr: list[it].descr,
                    route: it,
                };
            }


        }

        for (const socketRouterPlugin of this.plugins)
            socketRouterPlugin.start()


        this._newRoute(app, get, "jsonrpc", this._jsonRpcRouter.processRpc.bind(this._jsonRpcRouter), 5, middleWareOneWay || this._oneWayMiddleware.bind(this), affix, apiType );

    }

    _initOneWayRoutes(){


        return {

            /**
             * All Routes
             */
            'routes': {
                handle: this._showRoutes,
                maxCallsPerSecond: 50,
                descr: "Show all Routes",
            },


        };

    }

    _initTwoWaysRoutes() {

        try{

            return {

            };

        }catch(err){

            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, `${route} raised an error`, err );

            return {result:false, error: err.message};

        }


    }


    _showRoutes(){

        return this._routesList;

    }

    _oneWayMiddleware(route, data, clientSocket, method, socket){

    }

    _twoWaysMiddleware(route, data, clientSocket, method, socket){

    }

}

