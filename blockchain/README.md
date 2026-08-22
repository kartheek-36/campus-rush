# Campus Rush Verification

Facility check-in proofs only. Network: Polygon Amoy, chain ID 80002.

Foundry installation is required before deployment.

```powershell
$env:POLYGON_RPC_URL = "https://rpc-amoy.polygon.technology"
$env:PRIVATE_KEY = "0x..."
forge test
forge script script/DeployCampusRush.s.sol:DeployCampusRush --rpc-url $env:POLYGON_RPC_URL --broadcast
```

Never put `PRIVATE_KEY` in frontend code or commit environment files.
