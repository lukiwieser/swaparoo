const truffleAssert = require('truffle-assertions');

const GLDToken = artifacts.require("GLDToken");
const SILToken = artifacts.require("SILToken");
const SwaparooPool = artifacts.require("SwaparooPool");

contract("SwaparooPool", async accounts => {
  let goldToken;
  let silverToken;

  let pool;

  let owner = accounts[0];
  let liquidityProvider1 = accounts[1];
  let swapper1 = accounts[2];
  let liquidityProvider2 = accounts[3];

  async function deployAndInit() {
    // deployed behaves like a singleton. It will look if there is already an instance of the contract deployed to the blockchain via deployer.deploy. The information about which contract has which address on which network is stored in the build folder. new will always create a new instance. [https://ethereum.stackexchange.com/questions/42094/should-i-use-new-or-deployed-in-truffle-unit-tests]
    // Note: "owner" will have the initial balance
    goldToken = await GLDToken.new(web3.utils.toBN('10000000000000000000'));
    silverToken = await SILToken.new(web3.utils.toBN('10000000000000000000'));

    await goldToken.transfer(liquidityProvider1, web3.utils.toBN('2000000000000000000'));
    await goldToken.transfer(swapper1, web3.utils.toBN('100000000000000000'));
    await silverToken.transfer(liquidityProvider1, web3.utils.toBN('2000000000000000000'));
    await silverToken.transfer(swapper1, web3.utils.toBN('500000000000000000'));

    pool = await SwaparooPool.new(goldToken.address,silverToken.address, "Liquidity Pool Shares", "LP-GLD-SLV");
  }

  beforeEach("deploy and init", async () => {
    await deployAndInit();
  });

  describe('#create-contract', function () {
    it("create pool with non-contract address reverts", async () => {
      await truffleAssert.reverts(SwaparooPool.new(liquidityProvider1, silverToken.address, "Liquidity Pool Shares", "LP-GLD-SLV"));
      await truffleAssert.reverts(SwaparooPool.new(silverToken.address, liquidityProvider1, "Liquidity Pool Shares", "LP-GLD-SLV"));
    });
  
    it("create pool with the same addresses reverts", async () => {
      await truffleAssert.reverts(SwaparooPool.new(silverToken.address, silverToken.address, "Liquidity Pool Shares", "LP-GLD-SLV"));
    });
  });

  describe('#liquidity', function () {
    
    it("provide initial liquidity works", async () => {
      let amountGold = web3.utils.toBN('200000000000000000');
      let amountSilver = web3.utils.toBN('1000000000000000000');
      let expectedShares = web3.utils.toBN("447213595499957939");
  
      await goldToken.approve(pool.address, amountGold, {from: liquidityProvider1});
      await silverToken.approve(pool.address, amountSilver, {from: liquidityProvider1});
      await pool.provideLiquidity(amountGold,amountSilver, {from: liquidityProvider1});
  
      assert((await goldToken.balanceOf(pool.address)).eq(amountGold), "Balance of Gold-Token is wrong");
      assert((await silverToken.balanceOf(pool.address)).eq(amountSilver), "Balance of Silver-Token is wrong");
      assert((await pool.balanceOf(liquidityProvider1)).eq(expectedShares), "Wrong number of expected Shares");
    });
    
    it("provide further liqudity with correct ratio works", async () => {
      async function _provideLiquidity(_amountTokenA, _contractTokenA, _amountTokenB, _contractTokenB, _pool, _account) {
        await _contractTokenA.approve(_pool.address, _amountTokenA, {from: _account});
        await _contractTokenB.approve(_pool.address, _amountTokenB, {from: _account});
        await _pool.provideLiquidity(_amountTokenA, _amountTokenB, {from: _account});
      }
  
      // initial liqudity (ratio 2 : 10)
      await _provideLiquidity(web3.utils.toBN('200000000000000000'), goldToken, web3.utils.toBN('1000000000000000000'), silverToken, pool, liquidityProvider1)

      // further liqudity (ratio 1 : 5 aka 2 : 10)
      await _provideLiquidity(web3.utils.toBN('10000000000000000'), goldToken, web3.utils.toBN('50000000000000000'), silverToken, pool, liquidityProvider1);
      
      // check shares
      const sharesBefore = web3.utils.toBN("447213595499957939")
      const expectedNewShares = web3.utils.toBN("22360679774997896");  
      const expectedShares = expectedNewShares.add(sharesBefore);
      const shares = await pool.balanceOf(liquidityProvider1);
      assert(shares.eq(expectedShares), "Number of shares wrong");
    });

    it("provide further liqudity with incorrect ratio reverts", async () => {
      async function _provideLiquidity(_amountTokenA, _contractTokenA, _amountTokenB, _contractTokenB, _pool, _account) {
        await _contractTokenA.approve(_pool.address, _amountTokenA, {from: _account});
        await _contractTokenB.approve(_pool.address, _amountTokenB, {from: _account});
        await _pool.provideLiquidity(_amountTokenA, _amountTokenB, {from: _account});
      }
  
      // initial liqudity (ratio 2 : 10)
      await _provideLiquidity(web3.utils.toBN('200000000000000000'), goldToken, web3.utils.toBN('1000000000000000000'), silverToken, pool, liquidityProvider1)
  
      // further liqudity (ratio 3 : 10)
      await truffleAssert.reverts(
        _provideLiquidity(web3.utils.toBN('30000000000000000'), goldToken, web3.utils.toBN('100000000000000000'), silverToken, pool, liquidityProvider1)
      );
    });
  
  
    it("remove liquidity works", async () => {
      let amountGold = web3.utils.toBN('200000000000000000');
      let amountSilver = web3.utils.toBN('1000000000000000000');
  
      // Add liquidity
      await goldToken.approve(pool.address, amountGold, {from: liquidityProvider1});
      await silverToken.approve(pool.address, amountSilver, {from: liquidityProvider1});
      await pool.provideLiquidity(amountGold,amountSilver, {from: liquidityProvider1});
   
      // Balance before removing liqudity
      let amountGoldOfPoolBefore = await goldToken.balanceOf(pool.address);
      let amountSilverOfPoolBefore = await silverToken.balanceOf(pool.address);
      let amountSharesBefore = await pool.balanceOf(liquidityProvider1); 
  
      // Remove liquidity
      let sharesToRemove = web3.utils.toBN("227213595499957936");
      await pool.removeLiquidity(sharesToRemove, {from: liquidityProvider1});
  
      // Balance after removing liqudity
      let amountSharesAfter = await pool.balanceOf(liquidityProvider1); 
      let amountGoldOfPoolAfter = await goldToken.balanceOf(pool.address);
      let amountSilverOfPoolAfter = await silverToken.balanceOf(pool.address);
      let deltaGoldOfPool = amountGoldOfPoolBefore.sub(amountGoldOfPoolAfter);
      let deltaSilverOfPool = amountSilverOfPoolBefore.sub(amountSilverOfPoolAfter);
  
      let expectedDeltaGoldOfPool = web3.utils.toBN("101613008990009251");
      let expectedDeltaSilverOfPool = web3.utils.toBN("508065044950046259");
  
      assert(deltaGoldOfPool.eq(expectedDeltaGoldOfPool), "Delta of Gold-Token is wrong");
      assert(deltaSilverOfPool.eq(expectedDeltaSilverOfPool), "Delta of Silver-Token is wrong");
      assert(amountSharesBefore.sub(sharesToRemove).eq(amountSharesAfter), "Amount of shares is wrong");
    });

    it("remove all liquidity & provide again works", async () => {
      async function _provideLiquidity(_amountTokenA, _contractTokenA, _amountTokenB, _contractTokenB, _pool, _account) {
        await _contractTokenA.approve(_pool.address, _amountTokenA, {from: _account});
        await _contractTokenB.approve(_pool.address, _amountTokenB, {from: _account});
        await _pool.provideLiquidity(_amountTokenA, _amountTokenB, {from: _account});
      }
      
      // initial liquidity (ratio 2 : 10)
      await _provideLiquidity(web3.utils.toBN('200000000000000000'), goldToken, web3.utils.toBN('1000000000000000000'), silverToken, pool, liquidityProvider1);
      
      // further liquidity (ratio 1 : 5 aka 2 : 10)
      await _provideLiquidity(web3.utils.toBN('10000000000000000'), goldToken, web3.utils.toBN('50000000000000000'), silverToken, pool, liquidityProvider1);
      
      // remove all liquidity
      const shares = await pool.balanceOf(liquidityProvider1);
      await pool.removeLiquidity(shares, {from: liquidityProvider1});
  
      // add liquidity again
      await _provideLiquidity(web3.utils.toBN('200000000000000000'), goldToken, web3.utils.toBN('1000000000000000000'), silverToken, pool, liquidityProvider1);
    });

    it("remove liquidity when no liquidity was provided reverts", async () => {
      await truffleAssert.reverts(pool.removeLiquidity(web3.utils.toBN("1"), {from: liquidityProvider1}));
    });

    it("liquidity tokens can be transfered", async () => {
      // Add liquidity
      const amountGold   = web3.utils.toBN('200000000000000000');
      const amountSilver = web3.utils.toBN('1000000000000000000');
      await goldToken.approve(pool.address, amountGold, {from: liquidityProvider1});
      await silverToken.approve(pool.address, amountSilver, {from: liquidityProvider1});
      await pool.provideLiquidity(amountGold,amountSilver, {from: liquidityProvider1});
      
      // transfer tokens
      const liqudityTokensBefore1 = await pool.balanceOf(liquidityProvider1);
      await pool.transfer(liquidityProvider2, liqudityTokensBefore1, {from: liquidityProvider1});
  
      const liqudityTokensAfter1 = await pool.balanceOf(liquidityProvider1);
      const liqudityTokensAfter2 = await pool.balanceOf(liquidityProvider2);
  
      assert(liqudityTokensAfter2.eq(liqudityTokensBefore1), "provider2 should have all tokens of provider1");
      assert(liqudityTokensAfter1.eq(web3.utils.toBN("0")), "provider1 should not have any tokens");
    });
  });

  describe('#swap', function () {
    it("swap tokenB to tokenA yields correct balances", async () => {
      // tokenB = Silver, tokenA = Gold
  
      // Add liquidity
      let amountGold   = web3.utils.toBN('200000000000000000');
      let amountSilver = web3.utils.toBN('1000000000000000000');
      await goldToken.approve(pool.address, amountGold, {from: liquidityProvider1});
      await silverToken.approve(pool.address, amountSilver, {from: liquidityProvider1});
      await pool.provideLiquidity(amountGold,amountSilver, {from: liquidityProvider1});
      
      let balanceSilverBefore = await silverToken.balanceOf(swapper1);
      let balanceGoldBefore= await goldToken.balanceOf(swapper1);
      const poolGoldReserveBefore = await pool.getAmountTokenA();
      const poolSilverReserveBefore = await pool.getAmountTokenB();

      // Swap                               
      let amountTokenIn = web3.utils.toBN('300000000000000000');
      let addressTokenIn = silverToken.address;
      await silverToken.approve(pool.address, amountTokenIn, {from: swapper1});
      await pool.swap(amountTokenIn, addressTokenIn, {from: swapper1})
      
      // Calculate Expected Token Out
      const feePercentage = web3.utils.toBN('30');
      const amountTokenInFee = amountTokenIn.mul(feePercentage).div(web3.utils.toBN('10000'));
      const amountTokenInWithoutFee = amountTokenIn.sub(amountTokenInFee);
      const amoutTokenOutExpected = amountGold.mul(amountTokenInWithoutFee).div(amountSilver.add(amountTokenInWithoutFee));

      // Check Expected Balances of User
      const balanceGoldExpected = balanceGoldBefore.add(amoutTokenOutExpected);
      const balanceSilverExpected = balanceSilverBefore.sub(amountTokenIn);
      const balanceGoldAfter = await goldToken.balanceOf(swapper1);
      const balanceSilverAfter = await silverToken.balanceOf(swapper1);
      assert(balanceGoldAfter.eq(balanceGoldExpected), "Gold balance of user is wrong");
      assert(balanceSilverAfter.eq(balanceSilverExpected), "Silver balance of user is wrong");

      // Check Expected amount of tokens in pool
      // if this check works, this means the dividends are also saved correctly
      const poolGoldReserveExpected = poolGoldReserveBefore.sub(amoutTokenOutExpected);
      const poolSilverReserveExpected = poolSilverReserveBefore.add(amountTokenInWithoutFee);
      const poolGoldReserveAfter = await pool.getAmountTokenA();
      const poolSilverReserveAfter = await pool.getAmountTokenB();
      assert(poolGoldReserveAfter.eq(poolGoldReserveExpected), "Gold reserve of pool is wrong");
      assert(poolSilverReserveAfter.eq(poolSilverReserveExpected), "Silver reserve of pool is wrong");
    });

    it("swap tokenA to tokenB yields correct balances", async () => {
      // tokenA = Gold, tokenB = Silver
  
      // Add liquidity
      let amountGold   = web3.utils.toBN('200000000000000000');
      let amountSilver = web3.utils.toBN('1000000000000000000');
      await goldToken.approve(pool.address, amountGold, {from: liquidityProvider1});
      await silverToken.approve(pool.address, amountSilver, {from: liquidityProvider1});
      await pool.provideLiquidity(amountGold,amountSilver, {from: liquidityProvider1});
      
      // Record balances before swapping
      let balanceSilverBefore = await silverToken.balanceOf(swapper1);
      let balanceGoldBefore= await goldToken.balanceOf(swapper1);
      const poolGoldReserveBefore = await pool.getAmountTokenA();
      const poolSilverReserveBefore = await pool.getAmountTokenB();

      // Swap                               
      let amountTokenIn = web3.utils.toBN('20000000000000000');
      let addressTokenIn = goldToken.address;
      await goldToken.approve(pool.address, amountTokenIn, {from: swapper1});
      await pool.swap(amountTokenIn, addressTokenIn, {from: swapper1})
      
      // Calculate Expected Token Out
      const feePercentage = web3.utils.toBN('30');
      const amountTokenInFee = amountTokenIn.mul(feePercentage).div(web3.utils.toBN('10000'));
      const amountTokenInWithoutFee = amountTokenIn.sub(amountTokenInFee);
      const amoutTokenOutExpected = amountSilver.mul(amountTokenInWithoutFee).div(amountGold.add(amountTokenInWithoutFee));

      // Check Expected Balances of User
      const balanceGoldExpected = balanceGoldBefore.sub(amountTokenIn);
      const balanceSilverExpected = balanceSilverBefore.add(amoutTokenOutExpected);
      const balanceGoldAfter = await goldToken.balanceOf(swapper1);
      const balanceSilverAfter = await silverToken.balanceOf(swapper1);
      assert(balanceGoldAfter.eq(balanceGoldExpected), "Gold balance of user is wrong");
      assert(balanceSilverAfter.eq(balanceSilverExpected), "Silver balance of user is wrong");

      // Check Expected amount of tokens in pool
      // if this check works, this means the dividends are also saved correctly
      const poolGoldReserveExpected = poolGoldReserveBefore.add(amountTokenInWithoutFee);
      const poolSilverReserveExpected = poolSilverReserveBefore.sub(amoutTokenOutExpected);
      const poolGoldReserveAfter = await pool.getAmountTokenA();
      const poolSilverReserveAfter = await pool.getAmountTokenB();
      assert(poolGoldReserveAfter.eq(poolGoldReserveExpected), "Gold reserve of pool is wrong");
      assert(poolSilverReserveAfter.eq(poolSilverReserveExpected), "Silver reserve of pool is wrong");
    });
  
    it("swap does not change k", async () => {
      async function _swap(_amountTokenIn, _contractTokenIn, _account) {
        await _contractTokenIn.approve(pool.address, _amountTokenIn, {from: _account});
        await pool.swap(_amountTokenIn, _contractTokenIn.address, {from: _account})
      }
  
      // Add liquidity
      const amountGold   = web3.utils.toBN('200000000000000000');
      const amountSilver = web3.utils.toBN('1000000000000000000');
      await goldToken.approve(pool.address, amountGold, {from: liquidityProvider1});
      await silverToken.approve(pool.address, amountSilver, {from: liquidityProvider1});
      await pool.provideLiquidity(amountGold,amountSilver, {from: liquidityProvider1});
  
      // k Before
      const kBefore = await pool.getK();
  
      // Swap a few times
      await _swap(web3.utils.toBN('300000000000000000'), silverToken, swapper1);                              
      await _swap(web3.utils.toBN('100000000000000000'), silverToken, swapper1);                              
      await _swap(web3.utils.toBN( '20000000000000000'), goldToken, swapper1);                              
      await _swap(web3.utils.toBN('100000000000000000'), silverToken, swapper1);                              
      await _swap(web3.utils.toBN( '10000000000000000'), goldToken, swapper1);                              
  
      // k After
      const kAfter = await pool.getK();
  
      assert(kAfter.eq(kBefore), "k must stay the same");
    });
  });

  describe('#other', function () {
    
    it("transfer tokens to pool has no influence on swap", async () => {
      // Add liquidity
      const amountGold   = web3.utils.toBN('200000000000000000');
      const amountSilver = web3.utils.toBN('1000000000000000000');
      await goldToken.approve(pool.address, amountGold, {from: liquidityProvider1});
      await silverToken.approve(pool.address, amountSilver, {from: liquidityProvider1});
      await pool.provideLiquidity(amountGold,amountSilver, {from: liquidityProvider1});
      
      // record values before swap
      const balanceSilverBefore = await silverToken.balanceOf(swapper1);
  
      // transfer tokens to pool
      await goldToken.transfer(pool.address, web3.utils.toBN('10000000000000000'));
      await silverToken.transfer(pool.address, web3.utils.toBN('30000000000000'));

      // Swap                              
      const amountTokenIn = web3.utils.toBN('20000000000000000');
      const addressTokenIn = goldToken.address;
      await goldToken.approve(pool.address, amountTokenIn, {from: swapper1});
      await pool.swap(amountTokenIn, addressTokenIn, {from: swapper1});
  
      // Record values after swap
      const balanceSilverAfter = await silverToken.balanceOf(swapper1);
      
       // Calculate Expected Token Out
       const feePercentage = web3.utils.toBN('30');
       const amountTokenInFee = amountTokenIn.mul(feePercentage).div(web3.utils.toBN('10000'));
       const amountTokenInWithoutFee = amountTokenIn.sub(amountTokenInFee);
       const amoutTokenOutExpected = amountSilver.mul(amountTokenInWithoutFee).div(amountGold.add(amountTokenInWithoutFee));

      // check if balance is the same as expected
      // transfering tokens to the pool, could influence action like swapping, if not accounted for!
      //const amoutTokenOutExpected = web3.utils.toBN('90909090909090909');
      const balanceSilverExpected = balanceSilverBefore.add(amoutTokenOutExpected);
      assert(balanceSilverAfter.eq(balanceSilverExpected), "Silver balance wrong");
    });
  });
});

