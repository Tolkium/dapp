// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./CrowdSaleUpdatedToSol8.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleCrowdsale
 * @dev Crowdsale contract that inherits from Crowdsale, Pausable, and Ownable.
 * It allows pausing and resuming the crowdsale and withdrawal of unsold tokens by the contract owner.
 */
contract SimpleCrowdsale is Crowdsale, Pausable, Ownable {
    // Define events
    event CrowdsalePaused();
    event CrowdsaleUnpaused();
    event UnsoldTokensWithdrawn(address indexed owner, uint256 amount);

    /**
     * @dev Constructor for the SimpleCrowdsale contract.
     * @param rate The conversion rate from wei to tokens.
     * @param wallet The address where funds collected will be forwarded.
     * @param token The address of the token to be sold.
     */
    constructor(uint256 rate, address payable wallet, address token)
    Crowdsale(rate, wallet, IERC20(token))
    {
    _pause(); // Pause the crowdsale initially
    }

    /**
     * @dev Override the _preValidatePurchase function to check if the crowdsale is paused or not.
     * @param beneficiary The address that will receive the purchased tokens.
     * @param weiAmount The amount of wei to purchase tokens.
     */
    function _preValidatePurchase(address beneficiary, uint256 weiAmount) internal view virtual override {
        // Check if the crowdsale is not paused
        require(!paused(), "Crowdsale is paused");
        super._preValidatePurchase(beneficiary, weiAmount);
    }

    /**
     * @dev Function to pause the crowdsale. Can be called only by the contract owner.
     */
    function pause() external onlyOwner {
        _pause();
        emit CrowdsalePaused();
    }

    /**
     * @dev Function to unpause the crowdsale. Can be called only by the contract owner.
     */
    function unpause() external onlyOwner {
        _unpause();
        emit CrowdsaleUnpaused();
    }

    /**
     * @dev Function to withdraw unsold tokens by the contract owner.
     */
    function withdrawUnsoldTokens() external onlyOwner nonReentrant {
        // Get the balance of unsold tokens
        uint256 unsoldTokens = _token.balanceOf(address(this));
        // Check if there are any unsold tokens left
        require(unsoldTokens > 0, "No unsold tokens left");
        // Deliver the unsold tokens to the contract owner
        _deliverTokens(owner(), unsoldTokens);
        // Emit the UnsoldTokensWithdrawn event
        emit UnsoldTokensWithdrawn(owner(), unsoldTokens);
    }
}