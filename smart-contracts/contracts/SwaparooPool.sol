// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "./DualDividendToken.sol";

// TODO: keep frontrunning/dynamic nature in mind (min values etc.)
contract SwaparooPool is DualDividendToken {
    uint public constant FEE = 30; // 30 = 0.3% = 0.003
    uint public constant FEE_MULITPLIER = 10000;

    // save amount of tokens additionally in this contract, since:
    // 1) everybody can transfer e.g. tokenA to us, thus increasing the amount of this contract
    // 2) we want to differentiate between the balance of reserves and the balance of dividends
    uint public reserveA = 0;
    uint public reserveB = 0;
    uint private k = 0;

    event LiquidityProvided(address liquidityProvider, uint amountA, uint amountB, uint addedShares);
    event LiquidityRemoved(address liquidityProvider, uint removedShares, uint amountA, uint amountB);
    event Swap(address user, uint amountIn, address tokenIn, uint amountOut, address tokenOut);

    constructor(
        address _tokenA,
        address _tokenB,
        string memory _liquidityTokenName,
        string memory _liquidityTokenSymbol
    ) DualDividendToken(_tokenA, _tokenB, _liquidityTokenName, _liquidityTokenSymbol) {
        require(_tokenA != address(0) && _tokenB != address(0), "Tokens cannot have the zero address");
        require(Address.isContract(_tokenA) && Address.isContract(_tokenB), "Tokens must be contracts");
        require(_tokenA != _tokenB, "TokenA must be different from TokenB");

        // TODO: Introspection if really ERC20
        // tokenA & tokenB are already assigned in DualDividendToken
    }

    function getReserves() external view returns (uint, uint) {
        return (reserveA, reserveB);
    }

    function getTokenAddresses() external view returns (address, address) {
        return (address(tokenA), address(tokenB));
    }

    function getK() external view returns (uint) {
        return k;
    }

    function provideLiquidity(uint amountA, uint amountB) external {
        require(amountA > 0 && amountB > 0, "Number of tokens must be greater than 0");

        // determine shares
        uint shares;
        if (totalSupply() > 0) {
            require(reserveA * amountB == reserveB * amountA, "Wrong proportion");
            shares = Math.min(
                (amountA * totalSupply()) / reserveA,
                (amountB * totalSupply()) / reserveB
            );
        } else {
            shares = Math.sqrt(amountA * amountB);
        }
        _mint(msg.sender, shares);

        // update balances (TokenA & TokenB)
        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transferFrom(msg.sender, address(this), amountB);
        reserveA += amountA;
        reserveB += amountB;
        k = reserveA * reserveB;

        emit LiquidityProvided(msg.sender, amountA, amountB, shares);
    }

    function removeLiquidity(uint shares) external {
        require(totalSupply() > 0, "No liquidity");

        uint decreaseTokenA = (reserveA * shares) / totalSupply();
        uint decreaseTokenB = (reserveB * shares) / totalSupply();

        // adjust shares
        _burn(msg.sender, shares);

        // update balances
        tokenA.transfer(msg.sender, decreaseTokenA);
        tokenB.transfer(msg.sender, decreaseTokenB);
        reserveA -= decreaseTokenA;
        reserveB -= decreaseTokenB;
        k = reserveA * reserveB;

        emit LiquidityRemoved(msg.sender, shares, decreaseTokenA, decreaseTokenB);
    }

    function swap(uint amountIn, address _tokenIn) external {
        require(_tokenIn == address(tokenA) || _tokenIn == address(tokenB), "Token not supported");

        IERC20 tokenIn = IERC20(_tokenIn);
        IERC20 tokenOut = (tokenIn == tokenA) ? tokenB : tokenA;
        uint reserveIn  = (tokenIn == tokenA) ? reserveA : reserveB;
        uint reserveOut = (tokenIn == tokenA) ? reserveB : reserveA;

        uint amountInFees = (amountIn * FEE) / FEE_MULITPLIER;
        uint amountInWithoutFees = amountIn - amountInFees;
        uint amountOut = (reserveOut * amountInWithoutFees) / (reserveIn + amountInWithoutFees);

        tokenIn.transferFrom(msg.sender, address(this), amountIn);
        tokenOut.transfer(msg.sender, amountOut);
        reserveA = (tokenIn == tokenA) ? reserveA + amountInWithoutFees : reserveA - amountOut;
        reserveB = (tokenIn == tokenB) ? reserveB + amountInWithoutFees : reserveB - amountOut;

        if (tokenIn == tokenA) distributeDividendsA(amountInFees);
        if (tokenIn == tokenB) distributeDividendsB(amountInFees);

        emit Swap(msg.sender, amountIn, address(tokenIn), amountOut, address(tokenOut));
    }
}
