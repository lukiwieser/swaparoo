const truffleAssert = require('truffle-assertions');

const GLDToken = artifacts.require("GLDToken");
const SILToken = artifacts.require("SILToken");
const LiquidityPool = artifacts.require("LiquidityPool");

contract("Liquidity Pool Test", async accounts => {
  let goldToken;
  let silverToken;

    let pool;

  let owner = accounts[0];
  let liquidityProvider1 = accounts[1];
  let swapper1 = accounts[2];

  async function deployAndInit() {
    // deployed behaves like a singleton. It will look if there is already an instance of the contract deployed to the blockchain via deployer.deploy. The information about which contract has which address on which network is stored in the build folder. new will always create a new instance. [https://ethereum.stackexchange.com/questions/42094/should-i-use-new-or-deployed-in-truffle-unit-tests]
    // Note: "owner" will have the initial balance
    goldToken = await GLDToken.new(web3.utils.toBN('10000000000000000000'));
    silverToken = await SILToken.new(web3.utils.toBN('10000000000000000000'));

    await goldToken.transfer(liquidityProvider1, web3.utils.toBN('2000000000000000000'));
    await goldToken.transfer(swapper1, web3.utils.toBN('100000000000000000'));
    await silverToken.transfer(liquidityProvider1, web3.utils.toBN('2000000000000000000'));
    await silverToken.transfer(swapper1, web3.utils.toBN('500000000000000000'));

    pool = await LiquidityPool.new(goldToken.address,silverToken.address, "Liquidity Pool Shares", "LP-GLD-SLV");
  }

  beforeEach("deploy and init", async () => {
    await deployAndInit();
  });

  it("provide initial liquidity", async () => {
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

  it("remove liqudity liquidity", async () => {
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

  it("swap tokenB to tokenA works", async () => {
    // tokenA = Gold, tokenB = Silver
    let amountGold    = web3.utils.toBN('200000000000000000');
    let amountSilver = web3.utils.toBN('1000000000000000000');

    // Add liquidity
    await goldToken.approve(pool.address, amountGold, {from: liquidityProvider1});
    await silverToken.approve(pool.address, amountSilver, {from: liquidityProvider1});
    await pool.provideLiquidity(amountGold,amountSilver, {from: liquidityProvider1});
    
    let balanceSilverBefore = await silverToken.balanceOf(swapper1);
    let balanceGoldBefore= await goldToken.balanceOf(swapper1);

    // Swap                              
    let amountTokenIn = web3.utils.toBN('300000000000000000');
    let addressTokenIn = silverToken.address;
    await silverToken.approve(pool.address, amountTokenIn, {from: swapper1});
    await pool.swap(amountTokenIn, addressTokenIn, {from: swapper1})

    let amoutTokenOutExpected = web3.utils.toBN('46153846153846153');
    let balanceGoldExpected = balanceGoldBefore.add(amoutTokenOutExpected);
    let balanceSilverExpected = balanceSilverBefore.sub(amountTokenIn);

    let balanceSilverAfter = await silverToken.balanceOf(swapper1);
    let balanceGoldAfter = await goldToken.balanceOf(swapper1);

    assert(balanceSilverAfter.eq(balanceSilverExpected), "Gold balance is wrong");
    assert(balanceGoldAfter.eq(balanceGoldExpected), "Silver balance is wrong");
  });

  it("swap tokenA to tokenB works", async () => {
    // tokenA = Gold, tokenB = Silver

    // Add liquidity
    let amountGold   = web3.utils.toBN( '200000000000000000');
    let amountSilver = web3.utils.toBN('1000000000000000000');
    await goldToken.approve(pool.address, amountGold, {from: liquidityProvider1});
    await silverToken.approve(pool.address, amountSilver, {from: liquidityProvider1});
    await pool.provideLiquidity(amountGold,amountSilver, {from: liquidityProvider1});
    
    let balanceSilverBefore = await silverToken.balanceOf(swapper1);
    let balanceGoldBefore= await goldToken.balanceOf(swapper1);

    // Swap                              
    let amountTokenIn = web3.utils.toBN('20000000000000000');
    let addressTokenIn = goldToken.address;
    await goldToken.approve(pool.address, amountTokenIn, {from: swapper1});
    await pool.swap(amountTokenIn, addressTokenIn, {from: swapper1})

    let amoutTokenOutExpected = web3.utils.toBN('90909090909090909');
    let balanceSilverExpected = balanceSilverBefore.add(amoutTokenOutExpected);
    let balanceGoldExpected = balanceGoldBefore.sub(amountTokenIn);

    let balanceSilverAfter = await silverToken.balanceOf(swapper1);
    let balanceGoldAfter = await goldToken.balanceOf(swapper1);

    assert(balanceSilverAfter.eq(balanceSilverExpected), "Gold balance is wrong");
    assert(balanceGoldAfter.eq(balanceGoldExpected), "Silver balance is wrong");
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


  /*
  it("deploying test tokens works", async () => {
    let actual = await goldToken.totalSupply();
    let expected = web3.utils.toBN('10000000000000000000');
    assert(actual.eq(expected));

    let ownerBalance = ;

    let liquidityProvider1Balance = await goldToken.balanceOf(liquidityProvider1);
    console.log(liquidityProvider1Balance.toString());
  });
  */

});

