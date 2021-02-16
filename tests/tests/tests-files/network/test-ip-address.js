const {describe} = PandoraLibrary.tests;

const ipAdress = require( "../../../../src/network/ip-address" )

module.exports = function run () {

    describe("ip address tests", {

        'ipv4': async function () {

            let a1 = ipAdress.create("http","127.0.0.1", 80, "0000");
            this.expect( a1.toString(), "http://127.0.0.1:80");

            let a2 = ipAdress.create("https","127.0.0.1", 80, "0000");
            this.expect( a2.toString(), "https://127.0.0.1:80");

            let a3 = ipAdress.create(undefined, "http://127.0.0.1", 80, "0000");
            this.expect( a3.toString(), "http://127.0.0.1:80");

            let a4 = ipAdress.create("wss://127.0.0.1:80",);
            this.expect( a4.toString(), "wss://127.0.0.1:80");

        },

        'ipv6': async function () {

            let a1 = ipAdress.create("http","::ffff:127.0.0.1", 80, "0000");
            this.expect( a1.toString(), "http://127.0.0.1:80");

            let a2 = ipAdress.create("https","[::ffff:127.0.0.1]:80");
            this.expect( a2.toString(), "https://127.0.0.1:80");

        },

        'domain': async function () {

            let a1 = ipAdress.create("https","bitcoin.org:443");
            this.expect( a1.toString(), "https://bitcoin.org:443");

            let a2 = ipAdress.create("https://tor.org:80");
            this.expect( a2.toString(), "https://tor.org:80");

        },

    });

};
