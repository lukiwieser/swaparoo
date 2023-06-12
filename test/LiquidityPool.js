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


  async function deployAndInit() {
    // deployed behaves like a singleton. It will look if there is already an instance of the contract deployed to the blockchain via deployer.deploy. The information about which contract has which address on which network is stored in the build folder. new will always create a new instance. [https://ethereum.stackexchange.com/questions/42094/should-i-use-new-or-deployed-in-truffle-unit-tests]
    // Note: "owner" will have the initial balance
    goldToken = await GLDToken.new(web3.utils.toBN('10000000000000000000'));
    silverToken = await SILToken.new(web3.utils.toBN('10000000000000000000'));

    await goldToken.transfer(liquidityProvider1, web3.utils.toBN('2000000000000000000'));
    await silverToken.transfer(liquidityProvider1, web3.utils.toBN('2000000000000000000'));

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

