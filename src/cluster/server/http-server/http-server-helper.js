const fs = require('fs');
const getCertificate = require('get-ssl-certificate')

module.exports = class HttpServerHelper{

    static getCertificate(argv, domain = ''){

        if (domain === '')
            domain = argv.masterCluster.serverCluster.httpServer.address ;

        return new Promise( async (resolve)=>{

            if (domain === '')
                domain = await argv.readline.input("Enter the domain", domain);

            getCertificate.get(domain).then( (certificate) => {

                argv.masterCluster.serverCluster.httpServer.address = certificate.subject.CN.replace("*.","");
                resolve( certificate )

            }).catch((err)=>{

                resolve( undefined );

            });

        });

    }

    static findCertificate( ){

        const output = {
            cert: '',
            caBundle: '',
            key: '',
        };

        ['cert.pem', 'server-crt.pem'].map( it => {
            if ( it && fs.existsSync(`./certificates/${it}`))
                output.cert = `./certificates/${key}`;
        });


        ['chain.pem', 'ca-crt.pem'].map( it => {

            if (it && fs.existsSync(`./certificates/${it}`))
                output.caBundle = `./certificates/${it}`;

        });

        ['privkey.pem', 'server-key.pem'].map( it =>{
            if ( it && fs.existsSync(`./certificates/${it}`))
                output.key = `./certificates/${it}`;
        });

        return output;

    }

    static getCertificate(){

        const certificate = HttpServerHelper.findCertificate();

        if (certificate.cert === '' && certificate.caBundle === '' && certificate.key === '') return undefined;


        if (certificate.cert === '') throw "certificate.crt doesn't exist";
        if (certificate.caBundle === '') throw "ca_bundle.crt doesn't exist";
        if (certificate.key === '') throw "private.key doesn't exist";


        const options = {
            key: fs.readFileSync(certificate.key, 'utf8'),
            cert: fs.readFileSync(certificate.cert, 'utf8'),
            caBundle: fs.readFileSync(certificate.caBundle, 'utf8'),
        };


        options.address = HttpServerHelper.extractDomain(options.cert).subject.commonName.replace("*.","");

        return options;

    }

    static extractDomain(certFile){

        const { Certificate } = require('@fidm/x509');
        return Certificate.fromPEM( certFile );

    }

    static async createCertificate(domain){

        const createCert = require('create-cert');

        const output = await createCert({ days: 365, commonName: domain });


        output.address = HttpServerHelper.extractDomain(output.cert).subject.commonName.replace("*.","");

        return output;
    }

}

