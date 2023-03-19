const DevToken = artifacts.require("DevToken");
const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');

// Start a test series named DevToken, it will use 10 test accounts
contract("DevToken", async accounts => {
    // each it is a new test, and we name our first test initial supply
    it("initial supply", async () => {
        // wait until devtoken is deplyoed, store the results inside devToken
        // the result is a client to the Smart contract api
        devToken = await DevToken.deployed();
        // call our totalSUpply function
        let supply = await devToken.totalSupply()
        let decimals = await devToken.decimals()

        // Assert that the supply matches what we set in migration
        assert.equal(supply.toString(), 100000000 * 10 ** decimals, "Initial supply was not the same as in migration")

    });

    it("transfering tokens", async() => {
        devToken = await DevToken.deployed();
        let balance = await devToken.balanceOf(accounts[0]);
        console.log(balance.toString());

        let decimals = await devToken.decimals()
        // Grab initial balance
        let initial_balance = await devToken.balanceOf(accounts[1]);

        // transfer tokens from account 0 to 1
        await devToken.transfer(accounts[1], 100);

        let after_balance = await devToken.balanceOf(accounts[1]);

        assert.equal(after_balance.toNumber(), initial_balance.toNumber()+100, "Balance should have increased on reciever")

        // We can change the msg.sender using the FROM value in function calls.
        let account2_initial_balance = await devToken.balanceOf(accounts[2]);

        await devToken.transfer(accounts[2], 20, { from: accounts[1]});
        // Make sure balances are switched on both accounts
        let account2_after_balance = await devToken.balanceOf(accounts[2]);
        let account1_after_balance = await devToken.balanceOf(accounts[1]);

        assert.equal(account1_after_balance.toNumber(), after_balance.toNumber()-20, "Should have reduced account 1 balance by 20");
        assert.equal(account2_after_balance.toNumber(), account2_initial_balance.toNumber()+20, "Should have givne accounts 2 20 tokens");


        // Try transfering too much
        try {
            await devToken.transfer(accounts[2], 1, { from:accounts[1]});
        }catch(error){
            assert.equal(error.reason, "DevToken: cant transfer more than your account holds");
        }

    })


});