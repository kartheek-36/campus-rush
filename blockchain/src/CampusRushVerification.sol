// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CampusRushVerification {
    mapping(bytes32 => uint256) public checkInTimestamp;
    mapping(bytes32 => bool) public verified;

    event CheckInAnchored(bytes32 indexed recordHash, uint256 timestamp);

    function anchorCheckIn(bytes32 recordHash) external {
        require(recordHash != bytes32(0), "zero hash");
        require(!verified[recordHash], "already verified");
        verified[recordHash] = true;
        checkInTimestamp[recordHash] = block.timestamp;
        emit CheckInAnchored(recordHash, block.timestamp);
    }

    function verifyCheckIn(bytes32 recordHash) external view returns (bool, uint256) {
        return (verified[recordHash], checkInTimestamp[recordHash]);
    }
}
