const ipaddr = require('ipaddr.js');

const {Exception} = require('kernel').helpers;

module.exports = class ipAddress {

    static create(protocol, address, port, id) {

        if (protocol && typeof protocol ==="object" && protocol.constructor.name === "ipAddress")
            return protocol;
        else
            return new ipAddress(protocol, address, port, id);
    }


    constructor(protocol = '', address = '', port = '', id = '') {

        if (protocol && !address && !port){
            address = protocol;
            protocol = '';
            port = '';
        }

        this._processIpAddress(protocol, address, port, id);

    }

    isLocalIp(){
        return this.address.indexOf("127.0") === 0 || this.address === "localhost" || this.address === "0.0.0.0";
    }

    isNetworkIp(){
        return this.address.indexOf("192.168") === 0;
    }

    _processIpAddress(protocol, address, port, id) {

        let secured = false;

        /**
         * Detect the protocol from address
         */
        let index = address.indexOf("://", address);
        if (index > 0) {
            protocol = address.substr(0, index);
            address = address.substr(index + 3 );
        }

        if (protocol === "wss" || protocol === "https")
            secured = true;

        /**
         * in case it was normalized
         */
        address = address.replace(/\+/g, ":");

        /**
         * Detect the port and address from ipv6 standard [ipv6]:port
         */
        if (/\[[:.0-9a-fA-F]+\]:/.test(address)) {
            port = address.substr(address.lastIndexOf(":") + 1);
            address = address.substr(address.indexOf("[")+1, address.lastIndexOf("]") - address.indexOf("[") - 1 );
        }

        if (!port) {
            index = address.lastIndexOf(":");
            if (index > 0) {
                port = address.substr(index + 1);
                address = address.substr(0, index);
            }
        }

        /**
         * Normalize IPv6
         */
        if (ipaddr.IPv6.isIPv6(address))
            address = ipAddress.normalizeIPv6(address);
        else {

            /**
             * Normalize IPv4
             */
            if (ipaddr.IPv4.isIPv4(address))
                address = ipAddress.normalizeIPv4(address);
            else {

                /**
                 * it is a domain
                 */

            }

        }

        if (!port) port = 0;

        this.port = parseInt(port);
        if (typeof this.port !== "number") throw new Exception( this,"Port is invalid");

        this.address = address;
        this.secured = secured;
        this.protocol = protocol;
        this.id = id;

    }

    /**
     * display the ipAddress
     * @param protocol
     * @param port
     * @param id
     * @returns {string}
     */
    toString(protocol=true, port=true, id=false){

        return `${ (protocol && this.protocol !== '') ? this.protocol + '://' : '' }${this.address}${port ? ':'+this.port : ''}${ (id && this.id) ? ' uuid: '+this.id : ''}`;

    }

    toJSON(){
        return {
            protocol: this.protocol,
            address: this.address,
            port: this.port,
            id: this.id,
        }
    }

    fromJSON(json){
        if (typeof json === "string") json = JSON.parse(json);

        this.protocol = json.protocol;
        this.address = json.address;
        this.port = json.port;
        this.id = json.id;
    }

    static normalizeIPv6(addr){

        addr = ipaddr.IPv6.parse(addr);

        if (addr.isIPv4MappedAddress()) return addr.toIPv4Address().toNormalizedString();
        else return addr.toNormalizedString();

    }

    static normalizeIPv4(addr){
        return ipaddr.IPv4.parse(addr).toNormalizedString();
    }


}

