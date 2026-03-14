pragma solidity ^0.8.19;

contract MetabolicResetRecords {
    struct Record {
        address user;
        uint256 neatScore;
        uint256 deskHours;
        uint256 standingHours;
        uint256 steps;
        uint256 age;
        uint256 timestamp;
    }

    Record[] private records;
    mapping(address => uint256[]) private recordsByUser;

    event RecordAdded(
        address indexed user,
        uint256 indexed recordIndex,
        uint256 neatScore,
        uint256 timestamp
    );

    function addRecord(
        uint256 neatScore,
        uint256 deskHours,
        uint256 standingHours,
        uint256 steps,
        uint256 age
    ) external {
        require(neatScore <= 100, "NEAT score must be 0-100");
        records.push(
            Record({
                user: msg.sender,
                neatScore: neatScore,
                deskHours: deskHours,
                standingHours: standingHours,
                steps: steps,
                age: age,
                timestamp: block.timestamp
            })
        );
        uint256 index = records.length - 1;
        recordsByUser[msg.sender].push(index);
        emit RecordAdded(msg.sender, index, neatScore, block.timestamp);
    }

    function getRecordCount() external view returns (uint256) {
        return records.length;
    }

    function getRecord(uint256 index)
        external
        view
        returns (
            address user,
            uint256 neatScore,
            uint256 deskHours,
            uint256 standingHours,
            uint256 steps,
            uint256 age,
            uint256 timestamp
        )
    {
        require(index < records.length, "Invalid index");
        Record memory r = records[index];
        return (
            r.user,
            r.neatScore,
            r.deskHours,
            r.standingHours,
            r.steps,
            r.age,
            r.timestamp
        );
    }

    function getRecordCountByUser(address user) external view returns (uint256) {
        return recordsByUser[user].length;
    }

    function getRecordIndexByUser(address user, uint256 userIndex)
        external
        view
        returns (uint256)
    {
        require(userIndex < recordsByUser[user].length, "Invalid user index");
        return recordsByUser[user][userIndex];
    }
}
