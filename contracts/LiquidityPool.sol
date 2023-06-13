// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/Address.sol";


// TODO: keep frontrunning/dynamic nature in mind (min values etc.)
contract LiquidityPool is ERC20 {
    IERC20 public immutable tokenA;
    IERC20 public immutable tokenB;
    // save amount of tokens addtionally in this contract, 
    // since everybody can transfer e.g. tokenA to us, thus increasing the amount of this contract
    uint public amountTokenA = 0;
    uint public amountTokenB = 0; 
    uint private k = 0;
    bool public intialTokensProvided = false;

    constructor(
        address _tokenA, 
        address _tokenB, 
        string memory _liqudityTokenName, 
        string memory _liqudityTokenSymbol
        ) ERC20(_liqudityTokenName, _liqudityTokenSymbol) {
        require(_tokenA != address(0) && _tokenB != address(0), "Tokens cannot have the zero address");
        require(Address.isContract(_tokenA) && Address.isContract(_tokenB), "Tokens must be contracts");
        require(_tokenA != _tokenB, "TokenA must be different from TokenB");
        // TODO: Introspection if really ERC20

        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    function getK() external view returns (uint) {
        return k;
    }

    function provideLiquidity(uint _amountTokenA, uint _amountTokenB) external {
        require(_amountTokenA > 0 && _amountTokenB > 0, "number of tokens must be greater than 0");
        
        // TODO: revisit intialTokensProvided

        // determine shares
        uint numShares;
        if(intialTokensProvided) {
            // s = (dx/X)* T = (dy/Y)*T
            require(amountTokenA * _amountTokenB == amountTokenB * _amountTokenA, "proportion of token increase must equal proportion of reserve: dx/dy == X/Y");
            numShares = Math.min(
                (_amountTokenA/amountTokenA) * totalSupply(),
                (_amountTokenB/amountTokenB) * totalSupply()
            );
        } else {
            numShares = Math.sqrt(_amountTokenA * _amountTokenB);
            intialTokensProvided = true;
        }
        _mint(msg.sender, numShares);
       
        // update balances (TokenA & TokenB)
        tokenA.transferFrom(msg.sender, address(this), _amountTokenA);
        tokenB.transferFrom(msg.sender, address(this), _amountTokenB);
        amountTokenA += _amountTokenA;
        amountTokenB += _amountTokenB;
        k = amountTokenA * amountTokenB;
    }

    function removeLiquidity(uint _numShares) external {
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
    }

    
    function swap(uint _amountTokenIn, address _tokenIn) external {
        require(_tokenIn == address(tokenA) || _tokenIn == address(tokenB), "tokenIn not supported by this pool");

        if(_tokenIn == address(tokenA)) {
            uint amountTokenOut = (amountTokenB * _amountTokenIn) / (amountTokenA + _amountTokenIn);
            tokenA.transferFrom(msg.sender, address(this), _amountTokenIn);
            tokenB.transfer(msg.sender, amountTokenOut);
            amountTokenA += _amountTokenIn;
            amountTokenB -= amountTokenOut;
        } else {
            uint amountTokenOut = (amountTokenA * _amountTokenIn) / (amountTokenB + _amountTokenIn);
            tokenB.transferFrom(msg.sender, address(this), _amountTokenIn);
            tokenA.transfer(msg.sender, amountTokenOut);
            amountTokenB += _amountTokenIn;
            amountTokenA -= amountTokenOut;
        }
    }
}