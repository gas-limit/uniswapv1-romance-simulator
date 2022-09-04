This is a decentralized exchange that I forked from LearnWeb3DAO but modified it so I can create an unlimited amount of liquidity pools.

Before it was just one contract that can only handle one pair. I made it into a contract that creates pool contracts which speak to the main contract.
let me know what you think!


1. User can add liquidity which deposits erc20 / ETH pair into the contract, which speaks to the main contract that mints LP Tokens
2. User can remove liquidity, which gives them erc20 / ETH pair from the contract, which speaks to the main contract that burns LP tokens
3. User can swap tokens in the pair contracts
