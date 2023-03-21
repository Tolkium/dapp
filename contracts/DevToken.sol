// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DevToken
 * @dev A simple staking contract that allows users to stake tokens and earn rewards over time.
 * Users can stake a specified amount of tokens during the staking period and withdraw their stakes
 * along with the calculated rewards after the staking period has ended.
 */
contract DevToken is ERC20, Ownable {
    // Initial supply of the token is set to 100,000,000.
    uint256 public initialSupply = 100000000;
    
    /**
    @dev Constructor for the DevToken contract.
    */
    constructor() ERC20("BetaToken", "BT") {
        // The contract creator gets the initial supply of tokens.
        _mint(msg.sender, initialSupply * 10 ** decimals()); 
        // Initialize the stakeholders array with an empty stakeholder to prevent a user with index 0 being considered as non-staker.
        stakeholders.push();
    }

    // Structure to store the summary of all stakes for a user.
    struct StakingSummary {
        uint256 total_amount; // Total amount staked by the user.
        Stake[] stakes;       // Array of individual stakes.
    }

    // Structure to represent an individual stake.
    struct Stake {
        address user;         // Address of the user who staked the tokens.
        uint256 amount;       // Amount of tokens staked.
        uint256 since;        // Timestamp when the stake was made.
        uint256 claimable;    // Amount of tokens claimable as a reward.
    }

    // Structure to represent a stakeholder (user with active stakes).
    struct Stakeholder {
        address user;         // Address of the stakeholder.
        Stake[] address_stakes;// Array of individual stakes for the stakeholder.
    }

    uint256 public stakeStartDate = 0;   // The date when staking starts.
    Stakeholder[] internal stakeholders; // Array of all stakeholders.
    // Mapping to store the index of each stakeholder in the stakeholders array.
    mapping(address => uint256) internal stakes;
    // Event emitted when a user stakes tokens.
    event Staked(address indexed user, uint256 amount, uint256 index, uint256 timestamp);

    /**
    * @dev Sets the staking start date to control when users can start staking.
    * @param _timestamp The Unix timestamp to set as the staking start date.
    */
    function setStakeStartDate(uint256 _timestamp) public onlyOwner {
        require(block.timestamp < _timestamp, "Stake start date must be in the future");
        stakeStartDate = _timestamp;
    }

    /**
    * @dev Adds the given address as a stakeholder, assigns a new index to the address, and updates the mapping.
    * @param staker The address of the user to be added as a stakeholder.
    * @return The newly assigned index for the stakeholder.
    */
    function _addStakeholder(address staker) internal returns (uint256){
        // Add a new empty stakeholder to the stakeholders array.
        stakeholders.push();
        // Set the user index as the last element in the stakeholders array.
        uint256 userIndex = stakeholders.length - 1;
        // Assign the staker's address to the new stakeholder.
        stakeholders[userIndex].user = staker;
        // Update the stakes mapping with the new user index for the staker.
        stakes[staker] = userIndex;
        // Return the newly assigned index for the stakeholder.
        return userIndex;
    }

    /**
    * @dev Internal function that handles the actual staking process. 
    * It checks if the user is already a stakeholder or adds them as one, creates a new stake, and emits the Staked event.
    * @param _amount The amount of tokens to be staked by the sender.
    */
    function _stake(uint256 _amount) internal {
        require(_amount > 0, "Cannot stake nothing");
        // Get the user index from the stakes mapping.
        uint256 index = stakes[msg.sender];
        // Get the current block timestamp.
        uint256 timestamp = block.timestamp;
        // If the user index is 0, add the sender as a new stakeholder and update the index.
        if (index == 0) {
            index = _addStakeholder(msg.sender);
        }
        // Create a new Stake struct and push it to the sender's address_stakes array.
        stakeholders[index].address_stakes.push(Stake(msg.sender, _amount, timestamp, 0));
        // Emit the Staked event with the sender's address, staking amount, user index, and timestamp.
        emit Staked(msg.sender, _amount, index, timestamp);
    }

    /**
    * @dev Public function that Allows users to stake a specified amount of tokens, provided the staking period is active and they have enough tokens to stake.
    *      Calls the internal '_stake' function to update the staking data, and burns the staked tokens to remove them from the staker's
    *      balance during the staking period.
    * @param _amount The amount of tokens in wai to be staked. One token == (1 x 10^18 wei) == 1 000 000 000 000 000 000 wei.
    */
    function stake(uint256 _amount) public {
        require(stakeStartDate > 0, "Staking has not started yet");
        require(stakeStartDate < block.timestamp, "Staking has not started yet");
        require(block.timestamp < (stakeStartDate + 365 days), "Staking has ended");
        require(_amount <= balanceOf(msg.sender), "Cannot stake more than you own");
        // Call the internal _stake function to update the staking data.
        _stake(_amount);
        // Burn the staked tokens to remove them from the staker's balance during the staking period. 
        _burn(msg.sender, _amount);
    }

    /**
    * @dev Checks if the given address has any stakes, calculates rewards for each stake, and returns a StakingSummary struct.
    * @param _staker Address of the staker to check for stakes
    * @return StakingSummary struct containing the updated claimable rewards and total stake amount for the given staker
    */
    function hasStake(address _staker) public view returns (StakingSummary memory){
        uint256 totalStakeAmount;
        // Check if the staker has any stakes in the contract.
        require(stakeholders[stakes[_staker]].address_stakes.length > 0, "No stakes found for this staker");
        // Initialize a StakingSummary struct with the staker's stakes.
        StakingSummary memory summary = StakingSummary(0, stakeholders[stakes[_staker]].address_stakes);
        for (uint256 s = 0; s < summary.stakes.length; s += 1) {
            // Calculate the available reward for each stake based on the staking period.
            uint256 availableReward = calculateStakeReward(summary.stakes[s]);
            // Set the claimable field of each stake with the calculated reward.
            summary.stakes[s].claimable = availableReward;
            // Update the total stake amount.
            totalStakeAmount = totalStakeAmount + summary.stakes[s].amount;
        }
        // Set the total_amount field of the StakingSummary struct.
        summary.total_amount = totalStakeAmount;
        // Return the StakingSummary struct.
        return summary;
    }

    /**
    * @dev Function that allows users to withdraw their stakes and rewards after the staking period has ended.
    * Mints the total tokens (stakes and rewards) to the user's balance and clears their staking data.
    */
    function withdrawStakes() public {
        // Check if the staking start date is not zero, ensuring that staking has started
        require(stakeStartDate != 0, "Withdrawing is not allowed yet");
        // Ensure that the current block timestamp is greater than the sum of the staking start date and the staking duration (365 days)
        require(stakeStartDate + (365 days) < block.timestamp, "Withdrawing is not allowed yet");
        // Calculate the total tokens to be minted (stakes and rewards) by calling the internal _withdrawStakes function
        uint256 amount_to_mint = _withdrawStakes();
        // Mint the calculated amount to the user's balance
        _mint(msg.sender, amount_to_mint);
    }

    /**
    * @dev Internal function to handle the withdrawal of stakes and rewards for the sender by calculating the total tokens and clearing staking data.
    * @return totalTokens Total tokens to be minted for the sender, including their original stakes and calculated rewards.
    */
    function _withdrawStakes() internal returns (uint256){
        // Get the index of the staker in the stakeholders array.
        uint256 user_index = stakes[msg.sender];
        // Check if the user has any stakes
        require(stakeholders[user_index].address_stakes.length > 0, "Withdrawing not possible. --Reason: no stakes");
        // Initialize a variable to store the total tokens to be withdrawn.
        uint256 totalTokens = 0;
        // Loop through all the stakes of the staker.
        for (uint256 index = 0; index < stakeholders[user_index].address_stakes.length; index += 1) {
            // Get the current stake.
            Stake memory current_stake = stakeholders[user_index].address_stakes[index];
            // Get the staked amount of the current stake.
            uint256 amount = current_stake.amount;
            // Calculate the reward for the current stake.
            uint256 reward = calculateStakeReward(current_stake);
            // Update the total tokens to be withdrawn.
            totalTokens = totalTokens + amount + reward;
        }
        // Delete the 'address_stakes' array to remove all the stakes.
        delete stakeholders[user_index].address_stakes;
        // Return the total tokens to be withdrawn.
        return totalTokens;
    }

    /**
    * @dev Calculates the reward for the given stake based on the staking duration and the stake amount.
    * @param _current_stake Stake struct containing the stake information for which the reward will be calculated.
    * @return reward Calculated reward for the given stake.
    */
    function calculateStakeReward(Stake memory _current_stake) internal view returns (uint256) {
        // Get the start date of the stake from the input stake struct.
        uint256 startDate = _current_stake.since;
        // Calculate the end date of the staking period, which is 365 days after the staking start date.
        uint256 endDate = stakeStartDate + 365 days;
        // Calculate the number of days the stake has been staked, based on the stake start date and the staking end date.
        // 86399 (seconds in a day) to make sure we round up to the next whole day, so even a short time counts as a day.
        uint256 daysStaked = (endDate - startDate + 86399) / 86400;
        // Calculate the reward for the given stake by multiplying the stake amount, days staked, and the reward rate (11%).
        // The reward rate of 0.11111111 is converted to 11111111, which is then scaled down by a factor of (10 ** 8) in the second part of the equation.
        uint256 reward = (_current_stake.amount * daysStaked * 11111111) / (365 * 10 ** 8);
        // Return the calculated reward for the given stake.
        return reward;
    }

}