// Make sure the DevToken contract is included by requireing it.
const DevToken = artifacts.require("DevToken");
const SimpleCrowdSale = artifacts.require("SimpleCrowdsale");
const BN = require('bn.js');


// THis is an async function, it will accept the Deployer account, the network, and eventual accounts.
module.exports = async function (deployer, network, accounts) {
    // await while we deploy the DevToken
    await deployer.deploy(DevToken);
    const devToken = await DevToken.deployed()

    await deployer.deploy(SimpleCrowdSale, 5, accounts[0], devToken.address);
    const simpleCrowdSale = await SimpleCrowdSale.deployed();
};

