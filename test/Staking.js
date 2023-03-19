const helper = require("./helpers/truffleTestHelpers");
/* global BigInt */
const DevToken = artifacts.require("DevToken");
const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');
const BN = require('bn.js');

// Start a test series named DevToken, it will use 10 test accounts
contract("DevToken", async accounts => {

    it("Staking 100x2", async () => {
        devToken = await DevToken.deployed();

        // Stake 100 is used to stake 100 tokens twice and see that stake is added correctly and money burned
        let owner = accounts[0];
        // Set owner, user and a stake_amount
        let stake_amount = new BN('100000000000000000000000000', 10);
        // Add som tokens on account 1 asweel
        //await devToken.transfer(accounts[1], stake_amount, { from: owner });
        // Get init balance of user
        let balance = await devToken.balanceOf(owner)
        console.log("Balance before stake: " + balance.toString());

        // Stake the amount, notice the FROM parameter which specifes what the msg.sender address will be

        let stakeID = await devToken.stake(stake_amount, {from: owner});
        // Assert on the emittedevent using truffleassert
        // This will capture the event and inside the event callback we can use assert on the values returned
        truffleAssert.eventEmitted(
            stakeID,
            "Staked",
            (ev) => {
                // In here we can do our assertion on the ev variable (its the event and will contain the values we emitted)
                assert.equal(ev.amount, stake_amount, "Stake amount in event was not correct");
                assert.equal(ev.index, 1, "Stake index was not correct");
                return true;
            },
            "Stake event should have triggered");

        // stakeID = await devToken.stake(stake_amount, { from: owner });
        // // Assert on the emittedevent using truffleassert
        // // This will capture the event and inside the event callback we can use assert on the values returned
        // truffleAssert.eventEmitted(
        //     stakeID,
        //     "Staked",
        //     (ev) => {
        //         // In here we can do our assertion on the ev variable (its the event and will contain the values we emitted)
        //         assert.equal(ev.amount, stake_amount, "Stake amount in event was not correct");
        //         assert.equal(ev.index, 1, "Stake index was not correct");
        //         return true;
        //     },
        //     "Stake event should have triggered");

    });

    it("cannot stake more than owning", async() => {

        // Stake too much on accounts[2]
        devToken = await DevToken.deployed();

        try{
            await devToken.stake(1000000000, { from: accounts[2]});
        }catch(error){
            assert.equal(error.reason, "Cannot stake more than you own");
        }
    });

    // it("new stakeholder should have increased index", async () => {
    //     let stake_amount = 100;
    //     stakeID = await devToken.stake(stake_amount, { from: accounts[1] });
    //     // Assert on the emittedevent using truffleassert
    //     // This will capture the event and inside the event callback we can use assert on the values returned
    //     truffleAssert.eventEmitted(
    //         stakeID,
    //         "Staked",
    //         (ev) => {
    //             // In here we can do our assertion on the ev variable (its the event and will contain the values we emitted)
    //             assert.equal(ev.amount, stake_amount, "Stake amount in event was not correct");
    //             assert.equal(ev.index, 2, "Stake index was not correct");
    //             return true;
    //         },
    //         "Stake event should have triggered");
    // })

    it("withdraw stakes", async() => {
        devToken = await DevToken.deployed();

        let owner = accounts[0];
        // Try withdrawing 50 from first stake
        await helper.advanceTimeAndBlock(3600*24*365);

        //await devToken.withdrawStakes( {from:owner});
        // Grab a new summary to see if the total amount has changed
        let summary = await devToken.hasStake(owner);

        console.log(summary);

        assert.equal(summary.total_amount, stake_amount, "The total staking amount should be 150");
    });

    it("remove stake if empty", async() => {
        devToken = await DevToken.deployed();

        let owner = accounts[0];
        // Try withdrawing 50 from first stake AGAIN, this should empty the first stake
        await helper.advanceTimeAndBlock(3600*24*365);

        await devToken.withdrawStakes({from:owner});
        // Grab a new summary to see if the total amount has changed
        let summary = await devToken.hasStake(owner);
        console.log(summary);

        assert.equal(summary.stakes[0].user, "0x0000000000000000000000000000000000000000", "Failed to remove stake when it was empty");
    });

    // it("calculate rewards", async() => {
    //     devToken = await DevToken.deployed();
    //
    //     let owner = accounts[0];
    //
    //     // Owner has 1 stake at this time, its the index 1 with 100 Tokens staked
    //     // So lets fast forward time by 20 Hours and see if we gain 2% reward
    //     let summary = await devToken.hasStake(owner);
    //
    //
    //     let stake = summary.stakes[0];
    //
    //     assert.equal(stake.claimable, 11, "Reward should be 2 after staking for twenty hours with 100")
    //     // Make a new Stake for 1000, fast forward 20 hours again, and make sure total stake reward is 24 (20+4)
    //     // Remember that the first 100 has been staked for 40 hours now, so its 4 in rewards.
    //     await devToken.stake(200000000000000000000n, {from: owner});
    //     await helper.advanceTimeAndBlock(3600*24*98);
    //
    //     summary = await devToken.hasStake(owner);
    //
    //     stake = summary.stakes[1];
    //     let newstake = summary.stakes[2];
    //
    //     // assert.equal(stake.claimable, (22), "Reward should be 4 after staking for 40 hours")
    //     assert.equal(newstake.claimable, (5966514459665144596 ), "Reward should be 20 after staking 20 hours");
    // });
    //
    // it("reward stakes", async() => {
    //     devToken = await DevToken.deployed();
    //     // Use a fresh Account, Mint 1000 Tokens to it
    //     let staker = accounts[3];
    //     await devToken.transfer(accounts[3],1000);
    //     let initial_balance = await devToken.balanceOf(staker);
    //     // Make a stake on 200, fast forward 20 hours, claim reward, amount should be Initial balanace +4
    //     await devToken.stake(200, {from: staker});
    //     await helper.advanceTimeAndBlock(3600*20);
    //
    //     let stakeSummary = await devToken.hasStake(staker);
    //     let stake = stakeSummary.stakes[0];
    //     // Withdraw 100 from stake at index 0
    //     await devToken.withdrawStake(100, 0, { from: staker});
    //
    //     // Balance of account holder should be updated by 104 tokens
    //     let after_balance = await devToken.balanceOf(staker);
    //
    //     let expected = 1000-200+100+Number(stake.claimable);
    //     assert.equal(after_balance.toNumber(), expected, "Failed to withdraw the stake correctly")
    //
    //     // Claiming them again should not return any rewards since we reset timer
    //
    //     try{
    //         await devToken.withdrawStake(100, 0 , {from:staker});
    //     }catch(error){
    //         assert.fail(error);
    //     }
    //     let second_balance = await devToken.balanceOf(staker);
    //     // we should have gained 100 this time.
    //     assert.equal(second_balance.toNumber(), after_balance.toNumber()+100, "Failed to reset timer second withdrawal reward")
    // });
});