// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./exchange.sol/";

contract ERC20Pool {

    CatgirlDEX LPTokens = CatgirlDEX(msg.sender);

    address public ERC20Address1;
    address public ERC20Address2;


    // Exchange is inheriting ERC20, because our exchange would keep track of ERC LP tokens
    constructor(address _ERC20, address _ERC202) {
        require(_ERC20 != address(0), "Token address passed is a null address");
        ERC20Address1 = _ERC20;
        ERC20Address2 = _ERC202;
    }

    /** 
    * @dev Returns the amount of ERC20 held by the contract
    */
    function getReserveERC20() public view returns (uint) {
        return ERC20(ERC20Address1).balanceOf(address(this));
    }

    function getReserveERC202() public view returns (uint) {
        return ERC20(ERC20Address2).balanceOf(address(this));
    }

    /**
    * @dev Adds liquidity to the exchange.
    */
    function addLiquidity(uint _amount, uint _amount2) public payable returns (uint) {
        uint liquidity;
  
        uint Token1Reserve = getReserveERC20();
        uint Token2Reserve = getReserveERC202();
        ERC20 Token1 = ERC20(ERC20Address1);
        ERC20 Token2 = ERC20(ERC20Address2);
        /* 
            If the reserve is empty, intake any user supplied value for 
            `erc202` and ERC20 tokens because there is no ratio currently
        */
        if(Token1Reserve == 0) {
            // Transfer the `ERC20` addresses from the user's account to the contract
            Token1.transferFrom(msg.sender, address(this), _amount);
            Token2.transferFrom(msg.sender, address(this), _amount2);
            // Take the current ethBalance and mint `ethBalance` amount of LP tokens to the user.
            // `liquidity` provided is equal to `ethBalance` because this is the first time user 
            // is adding `Eth` to the contract, so whatever `Eth` contract has is equal to the one supplied 
            // by the user in the current `addLiquidity` call
            // `liquidity` tokens that need to be minted to the user on `addLiquidity` call should always be proportional
            // to the Eth specified by the user
            liquidity = Token2Reserve;
            LPTokens.mint(msg.sender, liquidity);
        } else {
            /* 
                If the reserve is not empty, intake any user supplied value for 
                `erc202` and determine according to the ratio how many ERC20 tokens
                need to be supplied to prevent any large price impacts because of the additional
                liquidity
            */
            // EthReserve should be the current ethBalance subtracted by the value of erc202 sent by the user
            // in the current `addLiquidity` call
            uint _Token2Reserve =  Token2Reserve - _amount2;
            // Ratio should always be maintained so that there are no major price impacts when adding liquidity
            // Ration here is -> (ERC20Amount user can add/USDCReserve in the contract) = (Eth Sent by the user/Eth Reserve in the contract);
            // So doing some maths, (ERC20Amount user can add) = (Eth Sent by the user * USDCReserve /Eth Reserve);
            uint ERC20Amount = (_amount2 * Token1Reserve)/(_Token2Reserve);
            require(_amount >= ERC20Amount, "Amount of tokens sent is less than the minimum tokens required");
            // transfer only (ERC20Amount user can add) amount of ERC20 from users account
            // to the contract
            Token1.transferFrom(msg.sender, address(this), ERC20Amount);
            // The amount of LP tokens that would be sent to the user should be propotional to the liquidity of
            // erc202 added by the user
            // Ratio here to be maintained is -> 
            // (lp tokens to be sent to the user (liquidity)/ totalSupply of LP tokens in contract) = (Eth sent by the user)/(Eth reserve in the contract)
            // by some maths -> liquidity =  (totalSupply of LP tokens in contract * (Eth sent by the user))/(Eth reserve in the contract)
            liquidity = (LPTokens.totalSupply() * _amount2)/ _Token2Reserve;
            LPTokens.mint(msg.sender, liquidity);
        }
         return liquidity;
    }

    /** 
    * @dev Returns the amount Eth/ERC20 Dev tokens that would be returned to the user
    * in the swap
    */
    function removeLiquidity(uint _amount) public returns (uint , uint) {
        require(_amount > 0, "_amount should be greater than zero");
        uint token2Reserve = getReserveERC202();
        uint _totalSupply = LPTokens.totalSupply();
        // The amount of erc202 that would be sent back to the user is based
        // on a ratio 
        // Ratio is -> (erc202 sent back to the user/ Current Eth reserve)  
        // = (amount of LP tokens that user wants to withdraw) / (total supply of LP tokens)
        // Then by some maths -> (Eth sent back to the user) 
        // = (current erc202 reserve * amount of LP tokens that user wants to withdraw) / (total supply of LP tokens)
        uint token2Amount = (token2Reserve * _amount)/ _totalSupply;
        // The amount of ERC20 that would be sent back to the user is based
        // on a ratio 
        // Ratio is -> (ERC20 sent back to the user) / (current ERC20 Dev token reserve)
        // = (amount of LP tokens that user wants to withdraw) / (total supply of LP tokens)
        // Then by some maths -> (ERC20 sent back to the user) 
        // = (current ERC20 reserve * amount of LP tokens that user wants to withdraw) / (total supply of LP tokens)
        uint token1Amount = (getReserveERC20() * _amount)/ _totalSupply;

        // Burn the sent `LP` tokens from the user's wallet because they are already sent to 
        // remove liquidity
        LPTokens.burn(msg.sender, _amount);
        // Transfer `erc202Amount` of erc202 from user's wallet to the contract
        ERC20(ERC20Address2).transfer(msg.sender, token1Amount);
        // Transfer `erc20Amount` of ERC20 from the user's wallet to the contract 
        ERC20(ERC20Address1).transfer(msg.sender, token1Amount);
        return (token2Amount, token1Amount);
    }

    /** 
    * @dev Returns the amount ERC202/ERC20 that would be returned to the user
    * in the swap
    */
    function getAmountOfTokens(
        uint256 inputAmount,
        uint256 inputReserve,
        uint256 outputReserve
    ) public pure returns (uint256) {
        require(inputReserve > 0 && outputReserve > 0, "invalid reserves");
        // We are charging a fee of `1%`
        // Input amount with fee = (input amount - (1*(input amount)/100)) = ((input amount)*99)/100
        uint256 inputAmountWithFee = inputAmount * 99;
        // Because we need to follow the concept of `XY = K` curve
        // We need to make sure (x + Δx) * (y - Δy) = x * y
        // So the final formula is Δy = (y * Δx) / (x + Δx)
        // Δy in our case is `tokens to be received`
        // Δx = ((input amount)*99)/100, x = inputReserve, y = outputReserve
        // So by putting the values in the formulae you can get the numerator and denominator
        uint256 numerator = inputAmountWithFee * outputReserve;
        uint256 denominator = (inputReserve * 100) + inputAmountWithFee;
        return numerator / denominator;
    }

    /** 
    * @dev Swaps ERC202 for ERC20
    */
    function token2ToToken1(uint _minToken1, uint _minToken2) public payable {


        uint256 token1Reserve = getReserveERC20();

        ERC20 Token2 = ERC20(ERC20Address2);
        Token2.transferFrom(msg.sender, address(this), _minToken2);
        uint256 tokensBought = getAmountOfTokens(
            _minToken2,
            getReserveERC202() - _minToken2,
            token1Reserve
        );

        require(tokensBought >= _minToken1, "insufficient output amount");
        // Transfer the first ERC20 tokens to the user
        ERC20(ERC20Address1).transfer(msg.sender, tokensBought);
    }


    /** do
    * @dev Swaps ERC20 Tokens for Eth
    */
    function TokenToEth(uint _tokensSold, uint _minToken2) public {
        
        uint256 tokenReserve = getReserveERC20();
        // call the `getAmountOfTokens` to get the amount of second erc20
        // that would be returned to the user after the swap
        uint256 erc202Bought = getAmountOfTokens(
            _tokensSold,
            tokenReserve,
            getReserveERC202()
        );
        require(erc202Bought >= _minToken2, "insufficient output amount");
        // Transfer first ERC20 tokens from the user's address to the contract
        ERC20(ERC20Address1).transferFrom(
            msg.sender,
            address(this),
            _tokensSold
        );
        // send the token2 to the user from the contract

        ERC20(ERC20Address2).transfer(msg.sender, _minToken2);
    }
}
