// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

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

    //mapping(address => uint256) private shares;
    //uint numTotalShares = 0;

    constructor(
        address _tokenA, 
        address _tokenB, 
        string memory _liqudityTokenName, 
        string memory _liqudityTokenSymbol
        ) ERC20(_liqudityTokenName, _liqudityTokenSymbol) {
        // TODO: validation (not zero address, must have code deployed)
        // TODO: Introspection if really ERC20
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }


    function provideLiquidity(uint _amountTokenA, uint _amountTokenB) external {
        require(_amountTokenA > 0 && _amountTokenB > 0, "number of tokens must be greater than 0");
        
        // TODO: check if approved/allowance
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
        }
        _mint(msg.sender, numShares);
       
        // update balances (TokenA & TokenB)
        tokenA.transferFrom(msg.sender, address(this), _amountTokenA);
        tokenB.transferFrom(msg.sender, address(this), _amountTokenB);
        amountTokenA += _amountTokenA;
        amountTokenB += _amountTokenB;
        k = amountTokenA * amountTokenB;
    }

    /*
    function swap(uint _amountTokenIn, address _tokenIn) external {
        require(_tokenIn == address(tokenA) || _tokenIn == address(tokenB), "tokenIn not supported by this pool")

    }
    */
}