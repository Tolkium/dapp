// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CrowdSaleUpdatedToSol8.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleCrowdsale is Crowdsale, Pausable, Ownable {
    // Define events
    event CrowdsalePaused();
    event CrowdsaleUnpaused();
    event UnsoldTokensWithdrawn(address indexed owner, uint256 amount);

    constructor(uint256 rate, address payable wallet, address token)
    Crowdsale(rate, wallet, IERC20(token))
    {
        // No additional logic required, as the imported Crowdsale contract handles the basic functionality
    }

    // Override the _preValidatePurchase function to check if the crowdsale is paused or not
    function _preValidatePurchase(address beneficiary, uint256 weiAmount) internal view virtual override whenNotPaused {
        super._preValidatePurchase(beneficiary, weiAmount);
    }

    // Function to pause the crowdsale
    function pause() external onlyOwner {
        _pause();
        emit CrowdsalePaused();
    }

    // Function to unpause the crowdsale
    function unpause() external onlyOwner {
        _unpause();
        emit CrowdsaleUnpaused();
    }

    // Function to withdraw unsold tokens by the contract owner
    function withdrawUnsoldTokens() external onlyOwner nonReentrant {
        uint256 unsoldTokens = _token.balanceOf(address(this));
        require(unsoldTokens > 0, "No unsold tokens left");
        _deliverTokens(owner(), unsoldTokens);
        emit UnsoldTokensWithdrawn(owner(), unsoldTokens);
    }
}