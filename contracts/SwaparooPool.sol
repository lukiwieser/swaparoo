// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "./DualAssetDividendToken.sol";

// TODO: keep frontrunning/dynamic nature in mind (min values etc.)
contract SwaparooPool is DualAssetDividendToken {
    IERC20 public immutable tokenA;
    IERC20 public immutable tokenB;
    // save amount of tokens addtionally in this contract, 
    // since everybody can transfer e.g. tokenA to us, thus increasing the amount of this contract
    uint public amountTokenA = 0;
    uint public amountTokenB = 0; 
    uint private k = 0;
    uint public fee = 30; // 30 = 0.3%, 

    event LiquidityProvided(address liquidityProvider, uint amountTokenA, uint amountTokenB, uint addedShares);
    event LiquidityRemoved(address liquidityProvider, uint removedShares, uint amountTokenA, uint amountTokenB);
    event Swap(address user, uint amountTokenIn, address addressTokenIn, uint amountTokenOut, address addressTokenOut);

    constructor(
        address _tokenA, 
        address _tokenB, 
        string memory _liqudityTokenName, 
        string memory _liqudityTokenSymbol
        ) DualAssetDividendToken(_tokenA, _tokenB, _liqudityTokenName, _liqudityTokenSymbol) {
        require(_tokenA != address(0) && _tokenB != address(0), "Tokens cannot have the zero address");
        require(Address.isContract(_tokenA) && Address.isContract(_tokenB), "Tokens must be contracts");
        require(_tokenA != _tokenB, "TokenA must be different from TokenB");
        // TODO: Introspection if really ERC20

        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    function getAmountTokenA() external view returns (uint) {
        return amountTokenA;
    }

    function getAmountTokenB() external view returns (uint) {
        return amountTokenB;
    }

    function getAddressTokenA() external view returns (address) {
        return address(tokenA);
    }

    function getAddressTokenB() external view returns (address) {
        return address(tokenB);
    }

    function getK() external view returns (uint) {
        return k;
    }

    // TODO: spot-price / expected-price?

    function provideLiquidity(uint _amountTokenA, uint _amountTokenB) external {
        require(_amountTokenA > 0 && _amountTokenB > 0, "number of tokens must be greater than 0");
        
        // TODO: revisit intialTokensProvided

        // determine shares
        uint numShares;
        if(totalSupply() > 0) {
            // s = (dx/X)* T = (dy/Y)*T
            require(amountTokenA * _amountTokenB == amountTokenB * _amountTokenA, "wrong-proportion");
            numShares = Math.min(
                (_amountTokenA/amountTokenA) * totalSupply(),
                (_amountTokenB/amountTokenB) * totalSupply()
            );
        } else {
            numShares = Math.sqrt(_amountTokenA * _amountTokenB);
        }
        _mint(msg.sender, numShares);
       
        // update balances (TokenA & TokenB)
        tokenA.transferFrom(msg.sender, address(this), _amountTokenA);
        tokenB.transferFrom(msg.sender, address(this), _amountTokenB);
        amountTokenA += _amountTokenA;
        amountTokenB += _amountTokenB;
        k = amountTokenA * amountTokenB;

        emit LiquidityProvided(msg.sender, _amountTokenA, _amountTokenB, numShares);
    }

    function removeLiquidity(uint _numShares) external {
        require(totalSupply() > 0, "no-liqudity");

        // be aware of integer division!
        // mathematically dx*(s/T) migth seem the same as (dx*s)/T, but the first one will always yield 0 due to integer divsion.
        uint decreaseTokenA = (amountTokenA * _numShares) / totalSupply();
        uint decreaseTokenB = (amountTokenB * _numShares) / totalSupply();

        // adjust shares
        _burn(msg.sender, _numShares);

        // update balances 
        tokenA.transfer(msg.sender, decreaseTokenA);
        tokenB.transfer(msg.sender, decreaseTokenB);
        amountTokenA -= decreaseTokenA;
        amountTokenB -= decreaseTokenB;
        k = amountTokenA * amountTokenB;

        emit LiquidityRemoved(msg.sender, _numShares, decreaseTokenA, decreaseTokenB);
    }

    
    function swap(uint _amountTokenIn, address _tokenIn) external {
        require(_tokenIn == address(tokenA) || _tokenIn == address(tokenB), "token-not-supported");
        // TODO: insuficcent liquditiy = not enough out tokens

        if(_tokenIn == address(tokenA)) {
            uint amountTokenInFees = (_amountTokenIn * fee) / 10000;
            uint amountTokenInPool = _amountTokenIn - amountTokenInFees;
            uint amountTokenOut = (amountTokenB * amountTokenInPool) / (amountTokenA + amountTokenInPool);
            tokenA.transferFrom(msg.sender, address(this), _amountTokenIn);
            tokenB.transfer(msg.sender, amountTokenOut);
            amountTokenA += amountTokenInPool;
            amountTokenB -= amountTokenOut;
            distributeDividendsAsset0(amountTokenInFees);
            emit Swap(msg.sender, _amountTokenIn, _tokenIn, amountTokenOut, address(tokenB));
        } else {
            uint amountTokenInFees = (_amountTokenIn * fee) / 10000;
            uint amountTokenInPool = _amountTokenIn - amountTokenInFees;
            uint amountTokenOut = (amountTokenA * amountTokenInPool) / (amountTokenB + amountTokenInPool);
            tokenB.transferFrom(msg.sender, address(this), _amountTokenIn);
            tokenA.transfer(msg.sender, amountTokenOut);
            amountTokenB += amountTokenInPool;
            amountTokenA -= amountTokenOut;
            distributeDividendsAsset1(amountTokenInFees);
            emit Swap(msg.sender, _amountTokenIn, _tokenIn, amountTokenOut, address(tokenA));
        }
    }
}