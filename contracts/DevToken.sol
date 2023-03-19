// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DevToken is ERC20, Ownable {

    uint256 public initialSupply = 100000000;

    constructor(uint256 _stakeStartDate) ERC20("DevToken", "DVTK") {
        _mint(msg.sender, initialSupply * 10 ** decimals());
        stakeholders.push();
        setStakeStartDate(_stakeStartDate);
    }

    struct StakingSummary {
        uint256 total_amount;
        Stake[] stakes;
    }

    struct Stake {
        address user;
        uint256 amount;
        uint256 since;
        uint256 claimable;
    }

    struct Stakeholder {
        address user;
        Stake[] address_stakes;
    }

    uint256 public stakeStartDate;
    Stakeholder[] internal stakeholders;

    mapping(address => uint256) internal stakes;

    event Staked(address indexed user, uint256 amount, uint256 index, uint256 timestamp);
    event CalculatedReward( uint256 startDate);
    event CalculatedReward1( uint256 startDate, uint256 endDate);
    event CalculatedReward2( uint256 startDate, uint256 endDate, uint256 daysStaked);
    event CalculatedReward3( uint256 startDate, uint256 endDate, uint256 daysStaked, uint256 reward);

    function setStakeStartDate(uint256 _timestamp) public onlyOwner {
        stakeStartDate = _timestamp;
    }

    function _addStakeholder(address staker) internal returns (uint256){
        stakeholders.push();
        uint256 userIndex = stakeholders.length - 1;
        stakeholders[userIndex].user = staker;
        stakes[staker] = userIndex;
        return userIndex;
    }


    function _stake(uint256 _amount) internal {
        require(_amount > 0, "Cannot stake nothing");

        uint256 index = stakes[msg.sender];
        uint256 timestamp = block.timestamp;
        if (index == 0) {
            index = _addStakeholder(msg.sender);
        }

        stakeholders[index].address_stakes.push(Stake(msg.sender, _amount, timestamp, 0));
        emit Staked(msg.sender, _amount, index, timestamp);
    }

    function stake(uint256 _amount) public {
        require(stakeStartDate < block.timestamp, "Staking has not started yet");
        require(block.timestamp < (stakeStartDate + 365 days), "Staking has ended");
        require(_amount <= balanceOf(msg.sender), "Cannot stake more than you own");

        _stake(_amount);
        _burn(msg.sender, _amount);
    }

    function hasStake(address _staker) public view returns (StakingSummary memory){
        uint256 totalStakeAmount;
        require(stakeholders[stakes[_staker]].address_stakes.length > 0, "No stakes found for this staker");

        StakingSummary memory summary = StakingSummary(0, stakeholders[stakes[_staker]].address_stakes);
        for (uint256 s = 0; s < summary.stakes.length; s += 1) {
            uint256 availableReward = calculateStakeReward(summary.stakes[s]);
            summary.stakes[s].claimable = availableReward;
            totalStakeAmount = totalStakeAmount + summary.stakes[s].amount;
        }
        summary.total_amount = totalStakeAmount;
        return summary;
    }

    function withdrawStakes() public {
        require(stakeStartDate + (365 days) < block.timestamp, "Withdrawing is not allowed yet");
        uint256 amount_to_mint = _withdrawStakes();
        _mint(msg.sender, amount_to_mint);
    }

    function _withdrawStakes() internal returns (uint256){
        uint256 user_index = stakes[msg.sender];
        uint256 totalTokens = 0;
        for (uint256 index = 0; index < stakeholders[user_index].address_stakes.length; index += 1) {
            Stake memory current_stake = stakeholders[user_index].address_stakes[index];
            uint256 amount = current_stake.amount;
            uint256 reward = calculateStakeReward(current_stake);
            totalTokens = totalTokens + amount + reward;
        }

        delete stakeholders[user_index].address_stakes;
        return totalTokens;
    }

    function calculateStakeReward(Stake memory _current_stake) internal view returns (uint256) {
        uint256 startDate = _current_stake.since;
        //emit CalculatedReward(startDate);
        uint256 endDate = stakeStartDate + 365 days;
        //emit CalculatedReward1(startDate, endDate);
        uint256 daysStaked = (endDate - startDate + 86399) / 86400;
        //emit CalculatedReward2(startDate, endDate, daysStaked);
        uint256 reward = (_current_stake.amount * daysStaked * 11111111) / (365 * 10 ** 8);
        //emit CalculatedReward3(startDate, endDate, daysStaked, reward);
        return reward;
    }

}