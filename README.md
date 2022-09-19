**This is a decentralized exchange that I forked from LearnWeb3DAO but modified it so I can create an unlimited amount of liquidity pools & also can support ERC20/ERC20 pairs.**
let me know what you think!

**2 Smart Contract files that make up exchange:**

**1. Exchange.sol**
(creates and manages pool pairs)
1. User can add liquidity which deposits erc20 / ETH pair OR ERC20/ ERC20 pair into the contract, which speaks to the main contract that mints LP Tokens
2. User can remove liquidity, which gives them erc20 / ETH pair from the contract, which speaks to the main contract that burns LP tokens
3. User can swap tokens in the pair contracts

**2. poolPairs.sol** 
(a liquidity pool that accepts two ERC20's as a pool pair)

![image](https://user-images.githubusercontent.com/100609687/190956541-b4914a7d-3d41-42ce-a77a-aefce28a74fb.png)
