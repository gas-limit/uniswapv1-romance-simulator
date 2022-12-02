// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract CatgirlDEX is ERC20 {

    constructor(address payable _foundation) ERC20("Kibbles", "NEKO") {
        foundation = _foundation;
    }

    event getPoolAddress(address indexed _address);
    address payable foundation;
    address[] ERC20Pools;
    address[] ETHERC20Pools;
    mapping(address => bool) isPool;

    
    mapping(address => uint) foundationTokenBalances;
    uint public foundationETHBalance;

    function setFoundationETHBalance(uint _donation) external {
        require(isPool[msg.sender]);
        foundationETHBalance += _donation;
    }

    function setFoundationTokenBalances(address _token, uint _amount) external {
        require(isPool[msg.sender]);
        foundationTokenBalances[_token] = _amount;
    }
    
    function createETHERC20Pool(address _ERC20Address) public {
    ETHERC20Pool tokenPair = new ETHERC20Pool(_ERC20Address);
    ETHERC20Pools.push(address(tokenPair));
    isPool[address(tokenPair)] == true;
    }

    function createERC20PairPool(address _ERC20Address1, address _ERC20Address2) public {
        ERC20Pool tokenPair = new ERC20Pool(_ERC20Address1, _ERC20Address2);
        ERC20Pools.push(address(tokenPair));
        isPool[address(tokenPair)] == true;
    }

    function getERC20Pools() public {
        uint poolAmount = ERC20Pools.length;
       
        for(uint i; i < poolAmount; i++){
            emit getPoolAddress(ERC20Pools[i]);
        }
        
    }

    function getETHERC20Pools() public {
        uint poolAmount = ETHERC20Pools.length;

        for(uint i; i < poolAmount; i++){
            emit getPoolAddress(ETHERC20Pools[i]);
        }

    }

    function mint(address to, uint256 amount) public {
    _mint(to, amount);
    }

    function burn(address _from, uint256 amount) public {
        _burn(_from,amount);
    }


}

contract ETHERC20Pool {

    CatgirlDEX LPTokens = CatgirlDEX(msg.sender);

    address public ERC20Address;
    constructor(address _ERC20) {
        require(_ERC20 != address(0), "Token address passed is a null address");
     
        ERC20Address = _ERC20;

    }

    function getReserve() public view returns (uint) {
        return ERC20(ERC20Address).balanceOf(address(this));
    }


    function addLiquidityETHTOKEN(uint _amount) public payable returns (uint) {
        uint liquidity;
        uint ethBalance = address(this).balance;
        uint TokenReserve = getReserve();
        ERC20 Token = ERC20(ERC20Address);

        if(TokenReserve == 0) {
            Token.transferFrom(msg.sender, address(this), _amount);

            liquidity = ethBalance;
            LPTokens.mint(msg.sender, liquidity);
        } else {
            uint ethReserve =  ethBalance - msg.value;

            uint ERC20Amount = (msg.value * TokenReserve)/(ethReserve);
            require(_amount >= ERC20Amount, "Amount of tokens sent is less than the minimum tokens required");

            Token.transferFrom(msg.sender, address(this), ERC20Amount);

            liquidity = (LPTokens.totalSupply() * msg.value)/ ethReserve;
            LPTokens.mint(msg.sender, liquidity);
        }
         return liquidity;
    }


    function removeLiquidityETHERC20(uint _amount) public returns (uint , uint) {
        require(_amount > 0, "_amount should be greater than zero");
        uint ethReserve = address(this).balance;
        uint _totalSupply = LPTokens.totalSupply();

        uint ethAmount = (ethReserve * _amount)/ _totalSupply;

        uint ERC20Amount = (getReserve() * _amount)/ _totalSupply;

        LPTokens.burn(msg.sender, _amount);

        payable(msg.sender).transfer(ethAmount);

        ERC20(ERC20Address).transfer(msg.sender, ERC20Amount);
        return (ethAmount, ERC20Amount);
    }

    function getAmountOfTokens(
        uint256 inputAmount, //coins to be swapped
        uint256 inputReserve, //reserve of coins minus tokens to be swapped
        uint256 outputReserve //reserve of other token
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

    //gets 1 percent
    function getDonationAmount(
        uint256 inputAmount,
        uint256 inputReserve,
        uint256 outputReserve
    ) public pure returns (uint256) {
        require(inputReserve > 0 && outputReserve > 0, "invalid reserves");
        uint256 numerator = inputAmount * outputReserve;
        uint256 denominator = (inputReserve * 100) + inputAmount;
        return numerator / denominator;
    }



    function ethToERC20(uint _minTokens) public payable {
        uint256 tokenReserve = getReserve();
        uint256 tokensBought = getAmountOfTokens(
            msg.value,
            address(this).balance - msg.value,
            tokenReserve
        );


        uint256 tokenDonation = getDonationAmount(
            msg.value, address(this).balance - msg.value, tokenReserve
        );


        require(tokensBought >= _minTokens, "insufficient output amount");

        LPTokens.setFoundationETHBalance(tokenDonation);
        ERC20(ERC20Address).transfer(msg.sender, tokensBought);
    }



    function ERC20ToEth(uint _tokensSold, uint _minEth) public {
        uint256 tokenReserve = getReserve();

        uint256 ethBought = getAmountOfTokens(
            _tokensSold,
            tokenReserve,
            address(this).balance
        );

        uint donationAmount = getAmountOfTokens(
            _tokensSold,
            tokenReserve,
            address(this).balance
        );
        require(ethBought >= _minEth, "insufficient output amount");
  
        ERC20(ERC20Address).transferFrom(
            msg.sender,
            address(this),
            _tokensSold
        );

        LPTokens.setFoundationTokenBalances(ERC20Address, donationAmount);
        payable(msg.sender).transfer(ethBought);
    }
}

contract ERC20Pool {

    CatgirlDEX LPTokens = CatgirlDEX(msg.sender);

    address public ERC20Address1;
    address public ERC20Address2;

    constructor(address _ERC20, address _ERC202) {
        require(_ERC20 != address(0), "Token address passed is a null address");
        ERC20Address1 = _ERC20;
        ERC20Address2 = _ERC202;
    }


    function getReserveERC20() public view returns (uint) {
        return ERC20(ERC20Address1).balanceOf(address(this));
    }

    function getReserveERC202() public view returns (uint) {
        return ERC20(ERC20Address2).balanceOf(address(this));
    }


    function addLiquidity(uint _amount, uint _amount2) public payable returns (uint) {
        uint liquidity;
  
        uint Token1Reserve = getReserveERC20();
        uint Token2Reserve = getReserveERC202();
        ERC20 Token1 = ERC20(ERC20Address1);
        ERC20 Token2 = ERC20(ERC20Address2);

        if(Token1Reserve == 0) {
         
            Token1.transferFrom(msg.sender, address(this), _amount);
            Token2.transferFrom(msg.sender, address(this), _amount2);

            liquidity = Token2Reserve;
            LPTokens.mint(msg.sender, liquidity);
        } else {

            uint _Token2Reserve =  Token2Reserve - _amount2;

            uint ERC20Amount = (_amount2 * Token1Reserve)/(_Token2Reserve);
            require(_amount >= ERC20Amount, "Amount of tokens sent is less than the minimum tokens required");

            Token1.transferFrom(msg.sender, address(this), ERC20Amount);

            liquidity = (LPTokens.totalSupply() * _amount2)/ _Token2Reserve;
            LPTokens.mint(msg.sender, liquidity);
        }
         return liquidity;
    }


    function removeLiquidity(uint _amount) public returns (uint , uint) {
        require(_amount > 0, "_amount should be greater than zero");
        uint token2Reserve = getReserveERC202();
        uint _totalSupply = LPTokens.totalSupply();

        uint token2Amount = (token2Reserve * _amount)/ _totalSupply;

        uint token1Amount = (getReserveERC20() * _amount)/ _totalSupply;


        LPTokens.burn(msg.sender, _amount);
 
        ERC20(ERC20Address2).transfer(msg.sender, token1Amount);

        ERC20(ERC20Address1).transfer(msg.sender, token1Amount);
        return (token2Amount, token1Amount);
    }


    function getAmountOfTokens(
        uint256 inputAmount,
        uint256 inputReserve,
        uint256 outputReserve
    ) public pure returns (uint256) {
        require(inputReserve > 0 && outputReserve > 0, "invalid reserves");

        uint256 inputAmountWithFee = inputAmount * 99;
  
        uint256 numerator = inputAmountWithFee * outputReserve;
        uint256 denominator = (inputReserve * 100) + inputAmountWithFee;
        return numerator / denominator;
    }

        //gets 1 percent
    function getDonationAmount(
        uint256 inputAmount,
        uint256 inputReserve,
        uint256 outputReserve
    ) public pure returns (uint256) {
        require(inputReserve > 0 && outputReserve > 0, "invalid reserves");
        uint256 numerator = inputAmount * outputReserve;
        uint256 denominator = (inputReserve * 100) + inputAmount;
        return numerator / denominator;
    }

    function approveToken2ToToken1(uint _tokensSold) public {
        ERC20 Token2 = ERC20(ERC20Address2);
        Token2.approve(address(this), _tokensSold);
    }

    /** 
    * @dev Swaps ERC202 for ERC20
    */
    function token2ToToken1(uint _tokensSold, uint _minToken2) public {


        uint256 token1Reserve = getReserveERC20();

        ERC20 Token2 = ERC20(ERC20Address2);
        Token2.transferFrom(msg.sender, address(this), _minToken2);
        uint256 tokensBought = getAmountOfTokens(
            _minToken2,
            token1Reserve - _minToken2,
            token1Reserve
        );

        uint256 donationAmount = getDonationAmount(_minToken2, token1Reserve, token1Reserve);


        require(tokensBought >= _tokensSold, "insufficient output amount");
        LPTokens.setFoundationTokenBalances(ERC20Address1, donationAmount);
        ERC20(ERC20Address1).transfer(msg.sender, tokensBought);
    }



    function Token1ToToken2(uint _tokensSold, uint _minToken2) public {
        
        uint256 tokenReserve = getReserveERC202();

        uint256 erc202Bought = getAmountOfTokens(
            _tokensSold,
            tokenReserve,
            getReserveERC202()
        );

        uint256 donationAmount = getDonationAmount(_tokensSold, tokenReserve, getReserveERC202());


        require(erc202Bought >= _minToken2, "insufficient output amount");
        
        LPTokens.setFoundationTokenBalances(ERC20Address2, donationAmount);
        
        ERC20(ERC20Address1).transferFrom(
            msg.sender,
            address(this),
            _tokensSold
        );

        ERC20(ERC20Address2).transfer(msg.sender, _minToken2);
    }
}
