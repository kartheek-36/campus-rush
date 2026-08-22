// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CampusRushVerification} from "../src/CampusRushVerification.sol";

contract CampusRushVerificationTest is Test {
    CampusRushVerification verification;
    bytes32 constant RECORD_HASH = keccak256("check-in-record");

    function setUp() public {
        verification = new CampusRushVerification();
    }

    function testValidCheckInHash() public {
        verification.anchorCheckIn(RECORD_HASH);
        assertTrue(verification.verified(RECORD_HASH));
    }

    function testRejectsZeroHash() public {
        vm.expectRevert("zero hash");
        verification.anchorCheckIn(bytes32(0));
    }

    function testRejectsDuplicateHash() public {
        verification.anchorCheckIn(RECORD_HASH);
        vm.expectRevert("already verified");
        verification.anchorCheckIn(RECORD_HASH);
    }

    function testVerificationAndTimestamp() public {
        vm.warp(123456);
        verification.anchorCheckIn(RECORD_HASH);
        (bool isVerified, uint256 timestamp) = verification.verifyCheckIn(RECORD_HASH);
        assertTrue(isVerified);
        assertEq(timestamp, 123456);
    }

    function testEventEmission() public {
        vm.expectEmit(true, false, false, true);
        emit CampusRushVerification.CheckInAnchored(RECORD_HASH, block.timestamp);
        verification.anchorCheckIn(RECORD_HASH);
    }
}
