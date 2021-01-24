/**
 * scope:
 *          argv, logger
 */

module.exports = class RoutesGuardian {

    constructor(scope){

        this._scope = scope;

        this._allowance = {};
        this._guards = {};

        setInterval(this._reset.bind(this), 2000);

    }

    allow(ip){
        this._allowance[ip] = true;
    }

    allowed(ip){
        return this._allowance[ip];
    }

    initRouteGuard(route, maxCallsPerSecond = 10){

        if ( !this._guards[route] )
            this._guards[route] = {
                calls: 0,
                maxCallsPerSecond: maxCallsPerSecond
            };

        this._guards[route].maxCallsPerSecond = maxCallsPerSecond;

    }

    _reset(){

        for (const key in this._guards)
            this._guards[key].calls = 0;

    }

    guardRoute(route, callback){

        const guard = this._guards[route];
        if (!guard) return callback();

        if (guard.calls >= guard.maxCallsPerSecond )
            return { result:false, error: "Status Code: 429 - rate limiting"};

        guard.calls ++ ;
        return callback();

    }

}

