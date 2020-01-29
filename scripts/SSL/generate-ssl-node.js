/**
 * ToDo: automatize the entire process
 */

console.log("Run the following: \n");

console.info("sudo add-apt-repository ppa:certbot/certbot");
console.info("sudo apt-get update");
console.info("sudo apt-get install certbot");
console.info("certbot certonly --manual \n");

console.info("or use sslforfree.com to generate the challenge file \n");

const express = require('express');

const app = express();

app.use('/.well-known/acme-challenge', express.static('scripts/SSL/acme-challenge' ));

app.get('/', (req, res)=>{

    res.send("This script is used to activate your SSL Certificate. <br/> In Browser you can access http://domain/.well-known/acme-challenge/CHALLENGE-FILENAME. <br/> You can use use sslforfree.com to generate the challenge");

});


app.listen(80, () => {
    console.log('HTTP server running on port 80');
});