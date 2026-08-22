// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {CampusRushVerification} from "../src/CampusRushVerification.sol";

contract DeployCampusRush is Script {
    function run() external returns (CampusRushVerification deployed) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);
        deployed = new CampusRushVerification();
        vm.stopBroadcast();
    }
}
