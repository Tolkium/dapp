// // const DevToken = artifacts.require("DevToken");
// // const SimpleCrowdsale = artifacts.require("SimpleCrowdsale");
// // const { assert } = require('chai');
// // const truffleAssert = require('truffle-assertions');

// // // Start a test series named DevToken, it will use 10 test accounts
// // contract("SimpleCrowdsale", async accounts => {
// //     // each it is a new test, and we name our first test initial supply
// //     it("initial supply", async () => {
// //         // wait until devtoken is deplyoed, store the results inside devToken
// //         // the result is a client to the Smart contract api
// //         devToken = await DevToken.deployed();
// //         simpleCrowdSale = await SimpleCrowdsale.deployed()
// //         // call our totalSUpply function
// //         await devToken.transfer(simpleCrowdSale.address, 100);

// //         let after_balance = await devToken.balanceOf(simpleCrowdSale.address);

// //         assert.equal(after_balance.toNumber(), 100, "Balance should have increased on reciever")

// //     });

// //     it("User should be able to buy tokens from crowdsale", async () => {
// //         const buyer = accounts[1];
// //         const beneficiary = accounts[2];
    
// //         // Send 1 ETH to buy tokens.
// //         const weiAmount = web3.utils.toWei("1", "ether");
// //         await simpleCrowdSale.buyTokens(beneficiary, { from: buyer, value: 20 });
    
// //         // Check the token balance of the beneficiary.
// //         const beneficiaryBalance = await devToken.balanceOf(beneficiary);
// //         assert.equal(beneficiaryBalance.toNumber(), 100, "Beneficiary should have received tokens");

// //         // Check the remaining tokens in the crowdsale contract.
// //         const crowdsaleBalance = await devToken.balanceOf(simpleCrowdSale.address);
// //         assert.equal(crowdsaleBalance.toNumber(), 0, "Crowdsale should have fewer tokens");
// //     });
// // });

// const { expect } = require("chai");
// const { BN, ether, expectEvent, expectRevert, time } = require("@openzeppelin/test-helpers");

// const SimpleCrowdsale = artifacts.require("SimpleCrowdsale");
// const DevToken = artifacts.require("DevToken");

// contract("SimpleCrowdsale", function ([owner, wallet, investor]) {
//   const rate = new BN("100");
//   const value = ether("1");

//   beforeEach(async function () {
//     this.token = await DevToken.deployed()
//     this.crowdsale = await SimpleCrowdsale.deployed();

//     // Transfer tokens to crowdsale
//     const totalSupply = await this.token.totalSupply();
    
//   });

//   it("should create crowdsale with correct parameters", async function () {
//     await this.token.transfer(this.crowdsale.address, totalSupply, { from: owner });
//     expect((await this.crowdsale._rate.call()).toString()).to.be.equal('5');
//     expect(await this.crowdsale._wallet.call()).to.equal(owner);
//     expect(await this.crowdsale._token.call()).to.equal(this.token.address);
//   });

//   it("should not accept payments while paused", async function () {
//     await this.crowdsale.pause({ from: owner });
//     await expectRevert.unspecified(this.crowdsale.send(value));
//     await expectRevert.unspecified(this.crowdsale.buyTokensByJagerAmount(investor, { value: value, from: investor }));
//   });

//   it("should accept payments while not paused", async function () {
//     const expectedTokenAmount = rate.mul(value);
//     const weiRaisedBefore = await this.crowdsale.weiRaised();

//     const receipt = await this.crowdsale.sendTransaction({ value: value, from: investor });
//     expectEvent(receipt, "TokensPurchased", {
//       purchaser: investor,
//       beneficiary: investor,
//       value: value,
//       amount: expectedTokenAmount,
//     });

//     expect(await this.token.balanceOf(investor)).to.be.bignumber.equal(expectedTokenAmount);
//     expect(await this.crowdsale.weiRaised()).to.be.bignumber.equal(weiRaisedBefore.add(value));
//   });

//   it("should allow owner to withdraw unsold tokens", async function () {
//     const tokensBeforeWithdraw = await this.token.balanceOf(owner);
//     const unsoldTokens = await this.token.balanceOf(this.crowdsale.address);

//     await this.crowdsale.withdrawUnsoldTokens({ from: owner });

//     expect(await this.token.balanceOf(owner)).to.be.bignumber.equal(tokensBeforeWithdraw.add(unsoldTokens));
//     expect(await this.token.balanceOf(this.crowdsale.address)).to.be.bignumber.equal("0");
//   });

//   it("should not allow non-owner to withdraw unsold tokens", async function () {
//     await expectRevert(this.crowdsale.withdrawUnsoldTokens({ from: investor }), "Ownable: caller is not the owner");
//   });
// });

const DevToken = artifacts.require("DevToken");
const SimpleCrowdsale = artifacts.require("SimpleCrowdsale");
const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');

contract("SimpleCrowdsale", async (accounts) => {
  const [owner, buyer1, buyer2, buyer3] = accounts;
  const rate = 5;

  let devToken, simpleCrowdSale;

  beforeEach(async () => {
    devToken = await DevToken.deployed();
    simpleCrowdSale = await SimpleCrowdsale.deployed();
  });

  it("initial supply", async () => {
    // wait until devtoken is deplyoed, store the results inside devToken
    // the result is a client to the Smart contract api
    devToken = await DevToken.deployed();
    simpleCrowdSale = await SimpleCrowdsale.deployed();
    let startingOwnerTokenBalance = await devToken.balanceOf(owner);
    const numberOfTokensTransfered = 100;
    
    // call our totalSUpply function
    await devToken.transfer(simpleCrowdSale.address, 100);

    let after_balance = await devToken.balanceOf(simpleCrowdSale.address);
    assert.equal(after_balance.toNumber(), numberOfTokensTransfered, "Balance should have increased on reciever")

    // Check the token balance of the crowdsale contract
    const crowdsaleTokenBalance = await devToken.balanceOf(simpleCrowdSale.address);
    assert.equal(crowdsaleTokenBalance.toNumber(), numberOfTokensTransfered, "Crowdsale should have the correct token balance");

    // Check the token balance of the owner after sending tokens
    const ownerTokenBalance = await devToken.balanceOf(owner);
    assert.equal(ownerTokenBalance.toString(), startingOwnerTokenBalance - numberOfTokensTransfered, "Owner should have x tokens left after transferring to crowdsale");

});

  it("should have the correct initial state", async () => {
    // Check initial rate
    const initialRate = await simpleCrowdSale._rate();
    assert.equal(initialRate.toNumber(), rate, "Initial rate should be correct");

    // Check initial wallet
    const initialWallet = await simpleCrowdSale._wallet();
    assert.equal(initialWallet, owner, "Initial wallet should be correct");

    // Check initial token
    const initialToken = await simpleCrowdSale._token();
    assert.equal(initialToken, devToken.address, "Initial token should be correct");

    // Check initial weiRaised
    const initialWeiRaised = await simpleCrowdSale._weiRaised();
    assert.equal(initialWeiRaised.toNumber(), 0, "Initial weiRaised should be 0");

    // Check if the crowdsale is not paused initially
    const isPaused = await simpleCrowdSale.paused();
    assert.equal(isPaused, false, "Crowdsale should not be paused initially");
  });

  it("User should be able to buy for someone", async () => {
    const buyer = accounts[1];
    const beneficiary = accounts[2];

    // Send 1 ETH to buy tokens.
    const weiAmount = web3.utils.toWei("1", "ether");
    await simpleCrowdSale.buyTokens(beneficiary, { from: buyer, value: 20 });

    // Check the token balance of the beneficiary.
    const beneficiaryBalance = await devToken.balanceOf(beneficiary);
    assert.equal(beneficiaryBalance.toNumber(), 100, "Beneficiary should have received tokens");

    // Check the remaining tokens in the crowdsale contract.
    const crowdsaleBalance = await devToken.balanceOf(simpleCrowdSale.address);
    assert.equal(crowdsaleBalance.toNumber(), 0, "Crowdsale should have fewer tokens");
  });

  it("should allow multiple users to purchase tokens simultaneously", async () => {
    const buyer1 = accounts[1];
    const buyer2 = accounts[2];
    const buyer3 = accounts[3];
    const beneficiaries = [buyer1, buyer2, buyer3];
    await devToken.transfer(simpleCrowdSale.address, 15000000000000000000);
    
    // Initialize weiAmount
    const weiAmount = web3.utils.toWei("1", "ether");
  
    // Calculate the total number of tokens to be purchased
    const totalTokens = weiAmount * beneficiaries.length * rate;
  
    // Check if the contract has enough tokens to cover the total amount
    const crowdSaleBalance = await devToken.balanceOf(simpleCrowdSale.address);
    assert.isAtLeast(crowdSaleBalance.toNumber(), totalTokens, "Contract does not have enough tokens");
  
    // Purchase tokens for each beneficiary
    for (let i = 0; i < beneficiaries.length; i++) {
      await simpleCrowdSale.buyTokens(beneficiaries[i], { from: beneficiaries[i], value: weiAmount });
    }
  
    // Check the token balance of each beneficiary
    const expectedTokenBalance = weiAmount * rate;
    for (let i = 0; i < beneficiaries.length; i++) {
      const beneficiaryBalance = await devToken.balanceOf(beneficiaries[i]);
      assert.equal(beneficiaryBalance.toNumber(), expectedTokenBalance, `Beneficiary ${i + 1} should have received tokens`);
    }
  
    // Check the remaining tokens in the crowdsale contract
    const crowdsaleBalance = await devToken.balanceOf(simpleCrowdSale.address);
    assert.equal(crowdsaleBalance.toNumber(), contractBalance.toNumber() - totalTokens, "Crowdsale should have fewer tokens");
  
    // Check if the _weiRaised variable updates correctly
    const expectedWeiRaised = weiAmount * beneficiaries.length;
    const actualWeiRaised = await simpleCrowdSale._weiRaised();
    assert.equal(actualWeiRaised.toNumber(), expectedWeiRaised, "WeiRaised should have updated correctly");
  
    // Check if the wallet address receives the combined ether sent
    const walletBalance = await web3.eth.getBalance(owner);
    assert.equal(walletBalance.toString(), expectedWeiRaised.toString(), "Wallet should receive the combined ether sent");
  });

});
