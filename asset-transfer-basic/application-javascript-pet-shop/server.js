const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const channelName = process.env.CHANNEL_NAME || 'petshop';
const chaincodeName = process.env.CHAINCODE_NAME || 'petshop';

const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'javascriptAppUser';

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

const express = require('express')
const mysql = require('mysql')
const session = require('express-session')
const fileUpload = require('express-fileupload');

const app = express()

app.use(fileUpload());
app.use(express.static('public'))
app.use(express.urlencoded({extended:true}))

app.set('view engine', 'ejs')
// require('./initconfigset.js')
app.use(session({
    secret: 'secretsession',
    resave: true,
    saveUninitialized: true
}))

const connection = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'password',
    database:'petshop'
})

app.get('/',async (req, res)=>{
    try {
        
        const ccp = buildCCPOrg1();
        // const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
        const wallet = await buildWallet(Wallets, walletPath);
        const gateway = new Gateway();
    
        // setup the gateway instance
        // The user will now be able to create connections to the fabric network and be able to
        // submit transactions and query. All transactions submitted by this gateway will be
        // signed by this user using the credentials stored in the wallet.
        try {
            await gateway.connect(ccp, {
                wallet,
                identity: org1UserId,
                discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
            });    
        } catch (Gatewayer) {
            console.error(`******** Gateway connect error: ${Gatewayer}`);
        } 
        
        // Build a network instance based on the channel where the smart contract is deployed
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        const contract = network.getContract(chaincodeName);
        // Let's try a query type operation (function).
        // This will be sent to just one peer and the results will be shown.
        console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');
        let result = await contract.evaluateTransaction('GetAllAssets');
        // console.log(`*** Result: ${prettyJSONString(result.toString())}`);
        
        res.render("pets",{pets: JSON.parse(prettyJSONString(result.toString())), loggedin: req.session.loggedin});    
    } catch (error) {
        console.error(`******** FAILED to get All Assets: ${error}`);
    }
})

app.get('/pets',async (req, res)=>{
    if (req.session.loggedin && req.session.username == 'admin') {
        try {
            const ccp = buildCCPOrg1();
            // const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
            const wallet = await buildWallet(Wallets, walletPath);
            const gateway = new Gateway();
        
            // setup the gateway instance
            // The user will now be able to create connections to the fabric network and be able to
            // submit transactions and query. All transactions submitted by this gateway will be
            // signed by this user using the credentials stored in the wallet.
            try {
                await gateway.connect(ccp, {
                    wallet,
                    identity: 'admin',
                    discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
                });    
            } catch (Gatewayer) {
                console.error(`******** Gateway connect error: ${Gatewayer}`);
            } 
            
    
            // Build a network instance based on the channel where the smart contract is deployed
            const network = await gateway.getNetwork(channelName);
    
            // Get the contract from the network.
            const contract = network.getContract(chaincodeName);
            // Let's try a query type operation (function).
            // This will be sent to just one peer and the results will be shown.
            console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');
            let result = await contract.evaluateTransaction('GetAllAssets');
            // console.log(`*** Result: ${prettyJSONString(result.toString())}`);
            
            res.render("adminpets",{pets: JSON.parse(prettyJSONString(result.toString())), loggedin: req.session.loggedin});    
        } catch (error) {
            console.error(`******** FAILED to get All Assets: ${error}`);
            // gateway.disconnect();
        }
    } else {
        res.redirect('/adminlogin');
    }
    
})

app.post('/adopt', async(req, res) => {
    try {
        if (req.session.loggedin) {
            const ccp = buildCCPOrg1();
            // const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
            const wallet = await buildWallet(Wallets, walletPath);
            const gateway = new Gateway();
        
            // setup the gateway instance
            // The user will now be able to create connections to the fabric network and be able to
            // submit transactions and query. All transactions submitted by this gateway will be
            // signed by this user using the credentials stored in the wallet.
            try {
                await gateway.connect(ccp, {
                    wallet,
                    identity: req.session.username,
                    discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
                });    
            } catch (Gatewayer) {
                console.error(`******** Gateway connect error: ${Gatewayer}`);
            } 
            

            // Build a network instance based on the channel where the smart contract is deployed
            const network = await gateway.getNetwork(channelName);

            // Get the contract from the network.
            const contract = network.getContract(chaincodeName);
            
            let id = req.body.assetID;
            let newOwner = req.session.username;

            console.log(`assetID:${id} :: newOwner:${newOwner}` );
            // console.log('\n--> Submit Transaction: TransferAsset asset1, transfer to new owner of Tom');
            // await contract.submitTransaction('TransferAsset', 'asset1', 'Tanmay');
            await contract.submitTransaction('TransferOwnerAdoptPet', id, newOwner, true);
            // console.log('*** Result: committed');
            // res.status(200);
            res.send({"assetID":id,"name":newOwner,'status':true});
        } else {
            // res.status(401);
            res.send({'status':false})
        }
        
    } catch (error) {
        console.error(`******** FAILED to get All Assets: ${error}`);
    }
})

app.get('/login', (req, res) => {
    res.render('login');
})

app.get('/adminlogin', (req, res) => {
    res.render('adminpage');
})

app.get('/logout', (req, res) => {
    req.session.destroy();
    req.session = null;
    res.redirect('/');
})

app.get('/adminlogout', (req, res) => {
    req.session.destroy();
    req.session = null;
    res.redirect('/adminlogin');
})

app.get('/signup', (req, res) => {
    res.render('signup');
})

app.post('/auth', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    if (username && password) {
        connection.query('SELECT * FROM users WHERE username=? AND password=?',[username, password], (error, results) => {
            if(error) throw error;

            if (results.length > 0) {
                req.session.loggedin = true;
                req.session.username = username;

                res.redirect('/');
            } else {
                res.send('Invalid username and/or password');
            }
            res.end();
        });
    } else {
        res.send('Please enter username and password');
        res.end();
    }
})

app.post('/adminauth', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    if (username && password) {
        if (username == 'admin' && password == 'adminpw') {
            req.session.loggedin = true;
            req.session.username = username;

            res.redirect('/pets');
        } else {
            res.send('Invalid username and/or password');
        }
    } else {
        res.send('Please enter username and password');
        res.end();
    }
})

app.post('/register', async(req, res) => {
    let username = req.body.username;
    let email = req.body.staticEmail;
    let password = req.body.inputPassword;

    if (email && password) {
        // build an in memory object with the network configuration (also known as a connection profile)
        const ccp = buildCCPOrg1();

        // build an instance of the fabric ca services client based on
		// the information in the network configuration
		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath);

        // in a real application this would be done only when a new user was required to be added
		// and would be part of an administrative flow
		await registerAndEnrollUser(caClient, wallet, mspOrg1, username, 'org1.department1');

        connection.query('INSERT INTO users(username, email, password) VALUES(?, ?, ?)',[username, email, password], (error, results) => {
            if(error) throw error;

            if (results.affectedRows > 0) {
                req.session.loggedin = true;
                req.session.username = username;
                res.redirect('/');
            } else {
                res.send('Please retry again');
            }
            res.end();
        });
    } else {
        res.send('Please enter email and password');
        res.end();
    }
})

app.get('/addpet', (req, res) => {
    res.render('addpet', {loggedin: req.session.loggedin});
})

app.post('/createpet', async(req, res) => {
    let petname = req.body.petname;
    let owner = req.body.owner;
    let breed = req.body.breed;
    let location = req.body.location;
    let age = req.body.age;
    let petid = Math.floor(new Date().getTime() / 1000);
    // let username = req.session.username;
    let vaccinationDate = req.body.vaccinationdate;
    let vaccinationName = req.body.vaccinationname;
    let username = 'admin';
    let isAddopted = req.body.isaddopted?true:false;
    const { petimage } = req.files;

    if(!petimage) res.send('Error infile');

    var newpath = path.join(__dirname, 'public','images',petimage.name);
    petimage.mv(newpath);

    let picture = 'images/'+petimage.name;
    // console.log(`${petid}`, `${petname}`, `${picture}`, `${owner}`, `${breed}`, `${location}`, age, `${vaccinationDate}`, `${vaccinationName}`, isAddopted);
    // res.send('image uploaded successfully');
    // build an in memory object with the network configuration (also known as a connection profile)
    const ccp = buildCCPOrg1();

    // build an instance of the fabric ca services client based on
    // the information in the network configuration
    // const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

    // setup the wallet to hold the credentials of the application user
    const wallet = await buildWallet(Wallets, walletPath);

    const gateway = new Gateway();

    // setup the gateway instance
    // The user will now be able to create connections to the fabric network and be able to
    // submit transactions and query. All transactions submitted by this gateway will be
    // signed by this user using the credentials stored in the wallet.
    await gateway.connect(ccp, {
        wallet,
        identity: username,
        discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
    });

    // Build a network instance based on the channel where the smart contract is deployed
    const network = await gateway.getNetwork(channelName);

    // Get the contract from the network.
    const contract = network.getContract(chaincodeName);

    // Now let's try to submit a transaction.
    // This will be sent to both peers and if both peers endorse the transaction, the endorsed proposal will be sent
    // to the orderer to be committed by each of the peer's to the channel ledger.
    console.log('\n--> Submit Transaction: CreateAsset, creates new asset with id, name, picture, owner, breed, location, age arguments');
    // (ctx contractapi.TransactionContextInterface, id string, name string, picture string, owner string, breed string, location string, age int)
    result = await contract.submitTransaction('CreateAsset', `${petid}`, `${petname}`, `${picture}`, `${owner}`, `${breed}`, `${location}`, age, `${vaccinationDate}`, `${vaccinationName}`, isAddopted);
    console.log('*** Result: committed');
    if (`${result}` !== '') {
        console.log(`*** Result: ${prettyJSONString(result.toString())}`);
        res.redirect('/pets');
    }
    res.redirect('/pets');
})

app.get('/editpet/', async(req, res) => {
    try {
        let assetid = req.query.uid
        // console.log("assetid::"+assetid);
        const ccp = buildCCPOrg1();
        // const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
        const wallet = await buildWallet(Wallets, walletPath);
        const gateway = new Gateway();
    
        // setup the gateway instance
        // The user will now be able to create connections to the fabric network and be able to
        // submit transactions and query. All transactions submitted by this gateway will be
        // signed by this user using the credentials stored in the wallet.
        try {
            await gateway.connect(ccp, {
                wallet,
                identity: 'admin',
                discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
            });    
        } catch (Gatewayer) {
            console.error(`******** Gateway connect error: ${Gatewayer}`);
        } 
        

        // Build a network instance based on the channel where the smart contract is deployed
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        const contract = network.getContract(chaincodeName);
        // Let's try a query type operation (function).
        // This will be sent to just one peer and the results will be shown.
        console.log('\n--> Evaluate Transaction: ReadAsset, function returns an asset with a given assetID');
		result = await contract.evaluateTransaction('ReadAsset', assetid);
        // let allPets = prettyJSONString(result.toString());
        // console.log(`*** Result: ${prettyJSONString(result.toString())}`);
        // console.log(allPets);
        
        // res.render("adminpets",{pets: JSON.parse(prettyJSONString(result.toString())), loggedin: req.session.loggedin});
        res.render('adminpetedit',{pets: JSON.parse(prettyJSONString(result.toString())), loggedin: req.session.loggedin});    
    } catch (error) {
        console.error(`******** FAILED to get All Assets: ${error}`);
        // gateway.disconnect();
    }
})

app.post('/updatepet', async(req, res) => {
    let petname = req.body.petname;
    let owner = req.body.owner;
    let breed = req.body.breed;
    let location = req.body.location;
    let age = req.body.age;
    let petid = req.body.assetid;
    let vaccinationDate = req.body.vaccinationdate;
    let vaccinationName = req.body.vaccinationname;
    var picture = req.body.oldimage;
    // let username = req.session.username;
    let username = 'admin';
    let isAddopted = req.body.isaddopted?true:false;
    // console.log(req.files);
    
    // if(req.files.petimage.name != null){
    if(req.files != null){    
        const { petimage } = req.files;
        // console.log("petimage::"+petimage);
        
        if(!petimage) res.send('Error infile');

        var newpath = path.join(__dirname, 'public','images',petimage.name);
        petimage.mv(newpath);

        picture = 'images/'+petimage.name;
    }

    // console.log(`${petid}`, `${petname}`, `${picture}`, `${owner}`, `${breed}`, `${location}`, age, `${vaccinationDate}`, `${vaccinationName}`, isAddopted);
    // res.send('image uploaded successfully');
    // build an in memory object with the network configuration (also known as a connection profile)
    const ccp = buildCCPOrg1();

    // build an instance of the fabric ca services client based on
    // the information in the network configuration
    // const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

    // setup the wallet to hold the credentials of the application user
    const wallet = await buildWallet(Wallets, walletPath);

    const gateway = new Gateway();

    // setup the gateway instance
    // The user will now be able to create connections to the fabric network and be able to
    // submit transactions and query. All transactions submitted by this gateway will be
    // signed by this user using the credentials stored in the wallet.
    await gateway.connect(ccp, {
        wallet,
        identity: username,
        discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
    });

    // Build a network instance based on the channel where the smart contract is deployed
    const network = await gateway.getNetwork(channelName);

    // Get the contract from the network.
    const contract = network.getContract(chaincodeName);

    // Now let's try to submit a transaction.
    // This will be sent to both peers and if both peers endorse the transaction, the endorsed proposal will be sent
    // to the orderer to be committed by each of the peer's to the channel ledger.
    console.log('\n--> Submit Transaction: UpdateAsset, for id, name, picture, owner, breed, location, age, vaccinationdate, vaccination name, addoptionflag arguments');
    // (ctx contractapi.TransactionContextInterface, id string, name string, picture string, owner string, breed string, location string, age int)
    result = await contract.submitTransaction('UpdateAsset', `${petid}`, `${petname}`, `${picture}`, `${owner}`, `${breed}`, `${location}`, age, `${vaccinationDate}`, `${vaccinationName}`, isAddopted);
    // console.log('*** Result: committed');
    if (`${result}` !== '') {
        console.log(`*** Result: ${prettyJSONString(result.toString())}`);
        res.redirect('/pets');
    }
    res.redirect('/pets');
})

app.get('/petdetail/', async(req, res) => {
    try {
        let assetid = req.query.uid;
        let usertype = req.query.type;
        var loginredirect;
        if (usertype=='spec') {
            loginredirect = "/adminlogin";
        } else {
            loginredirect = "/login";
        }
        if(req.session.loggedin){
            // console.log("assetid::"+assetid);
            const ccp = buildCCPOrg1();
            // const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
            const wallet = await buildWallet(Wallets, walletPath);
            const gateway = new Gateway();
        
            // setup the gateway instance
            // The user will now be able to create connections to the fabric network and be able to
            // submit transactions and query. All transactions submitted by this gateway will be
            // signed by this user using the credentials stored in the wallet.
            try {
                await gateway.connect(ccp, {
                    wallet,
                    identity: req.session.username,
                    discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
                });    
            } catch (Gatewayer) {
                console.error(`******** Gateway connect error: ${Gatewayer}`);
            } 
            

            // Build a network instance based on the channel where the smart contract is deployed
            const network = await gateway.getNetwork(channelName);

            // Get the contract from the network.
            const contract = network.getContract(chaincodeName);
            // Let's try a query type operation (function).
            // This will be sent to just one peer and the results will be shown.
            console.log('\n--> Evaluate Transaction: ReadAsset, function returns an asset with a given assetID');
            result = await contract.evaluateTransaction('ReadAsset', assetid);
            // console.log(`*** Result: ${prettyJSONString(result.toString())}`);
            
            // res.render("adminpets",{pets: JSON.parse(prettyJSONString(result.toString())), loggedin: req.session.loggedin});
            res.render('petdetail',{pets: JSON.parse(prettyJSONString(result.toString())), loggedin: req.session.loggedin, username: req.session.username});
        } else {
            res.redirect(loginredirect);
        }
    } catch (error) {
        console.error(`******** FAILED to get All Assets: ${error}`);
        // gateway.disconnect();
    }
})

app.get('/pethistory/', async(req, res) => {
    try {
        // user will not be able to check pet detail if he is not loggedin. make user login to view history
        let assetid = req.query.assetID;
        console.log("History assetid::"+assetid);
        const ccp = buildCCPOrg1();
        // const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
        const wallet = await buildWallet(Wallets, walletPath);
        const gateway = new Gateway();
        
        // setup the gateway instance
        // The user will now be able to create connections to the fabric network and be able to
        // submit transactions and query. All transactions submitted by this gateway will be
        // signed by this user using the credentials stored in the wallet.
        try {
            await gateway.connect(ccp, {
                wallet,
                identity: org1UserId,
                discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
            });    
        } catch (Gatewayer) {
            console.error(`******** Gateway connect error: ${Gatewayer}`);
        } 
        

        // Build a network instance based on the channel where the smart contract is deployed
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        const contract = network.getContract(chaincodeName);
        // Let's try a query type operation (function).
        // This will be sent to just one peer and the results will be shown.
        console.log('\n--> Evaluate Transaction: ReadAsset, function returns an asset with a given assetID');
		result = await contract.evaluateTransaction('GetAssetHistory', assetid);
        
        // console.log(`*** Asset History: ${prettyJSONString(result.toString())}`);
        
        res.send({pets: JSON.parse(prettyJSONString(result.toString()))});    
    } catch (error) {
        console.error(`******** FAILED to get All Assets: ${error}`);
        // gateway.disconnect();
    }
})

app.get('/checkloggedin', (req, res) => {
    if (req.session.loggedin) {
        res.send({'status':true})    
    } else {
        res.send({'status':false})
    }
})
// const petRouter = require('./routes/pets')

// app.use('/pets', petRouter)

app.listen(3000,function(req, res){
    console.log('server is listening on 3000 port')
})