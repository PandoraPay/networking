/**
 * JSON RPC 2.0 support
 *
 * It is necessary to set Content-Type application/json
 *
 * examples:
 *
 * curl -X POST -H 'Content-Type: application/json' --data '{"jsonrpc":"2.0","method":"ping","params":[],"id":67}' 127.0.0.1:4000/jsonrpc
 * curl -X GET --data 'jsonrpc?jsonrpc=2.0&method=ping&params=[]&id=67' 127.0.0.1:4000
 * curl -X GET 127.0.0.1:4000/jsonrpc?jsonrpc=2.0&method=ping&params=[]&id=67
 * http://127.0.0.1:4000/jsonrpc?jsonrpc=2.0&method=ping&params=[]&id=67
 * http://127.0.0.1:4000/jsonrpc?jsonrpc=2.0&method=ping&params=[]&id=67
 *
 *
 */


const jsonRpcErrorMessages = {
    "-32600": "Invalid Request",
    "-32601": "Method not found",
    "-32602": "Invalid params",
    "-32603": "Internal error",
};

export default class JsonRpcRouter{

    constructor(scope){
        this._scope = scope;

        this._list = this._initJsonRpcRoutes();
    }

    _initJsonRpcRoutes(){
        return {
            "ping": {
                handle: this._ping,
                maxCallsPerSecond: 100,
                descr: "Ping Pong",
            }
        }
    }

    processRpc( req, res ){

        try {

            if (req.jsonrpc !== "2.0") throw "rpc";
            if (!this._list[ req.method ]) throw "method";

            return this._returnData(this._list[req.method].handle.call(this, req.params, res), req.id);

        } catch (err){

            let code;

            if (err === "params") code = -32602;
            else if (err === "method") code = -32601;
            else if (err === "rpc")  code = -32600;
            else code = -32603;

            return this._returnError(code, req.id);

        }

    }

    _returnData(data, id){
        return {
            id:  id,
            jsonrpc: "2.0",
            result: data,
        }
    }

    _returnError(code, id){

        return {
            id: id,
            jsonrpc: "2.0",
            error: {
                code: code,
                message: jsonRpcErrorMessages[code.toString()]
            }
        }
    }

    /**
     * ping pong
     * @returns {string}
     * @private
     */
    _ping(){

        return "pong";

    }

}

