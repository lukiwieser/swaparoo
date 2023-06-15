const truffleAssert = require('truffle-assertions');

const GLDToken = artifacts.require("GLDToken");
const SILToken = artifacts.require("SILToken");
const BRZToken = artifacts.require("BRZToken");
const SwaparooCore = artifacts.require("SwaparooCore");
const SwaparooPool = artifacts.require("SwaparooPool");

contract("SwaparooCore", async accounts => {
  // contracts:
  let goldToken;
  let silverToken;
  let bronzeToken;
  let swaparooCore;
  // accounts:
  let owner = accounts[0];
  let billy = accounts[1]
  let alice = accounts[2]

  async function deployAndInit() {
    // deployed behaves like a singleton. It will look if there is already an instance of the contract deployed to the blockchain via deployer.deploy. The information about which contract has which address on which network is stored in the build folder. new will always create a new instance. [https://ethereum.stackexchange.com/questions/42094/should-i-use-new-or-deployed-in-truffle-unit-tests]
    // Note: "owner" will have the initial balance
    goldToken = await GLDToken.new(web3.utils.toBN('10000000000000000000'));
    silverToken = await SILToken.new(web3.utils.toBN('10000000000000000000'));
    bronzeToken = await BRZToken.new(web3.utils.toBN('10000000000000000000'));
    swaparooCore = await SwaparooCore.new();
  }

  beforeEach("deploy and init", async () => {
    await deployAndInit();
  });
  
  describe('#manage-role-owner', function () {
    it("owner should be set after contract creation", async () => {
        assert(await swaparooCore.isOwner(owner));
    });

    it("owner can grant others role of owner", async () => {
        const result = await swaparooCore.addOwner(billy);

        truffleAssert.eventEmitted(result, 'OwnerAdded', (ev) => {
            return ev['account'] === billy;
        }, 'OwnerAdded should be emitted with correct parameters');
    });

    it("owner can renounce, if there are other owners", async () => {
        await swaparooCore.addOwner(billy);

        const result = await swaparooCore.renounceOwner();
        
        truffleAssert.eventEmitted(result, 'OwnerRemoved', (ev) => {
            return ev['account'] === owner;
        }, 'OwnerRemoved should be emitted with correct parameters');

        assert(!await swaparooCore.isOwner(owner));
    });

    it("others cannot add owners", async () => {
      await truffleAssert.reverts(
        swaparooCore.addOwner(billy, {from: alice}),
        "unauthorized"
      );
    });

    it("owner cannot renounce, if they are the only owner", async () => {
        await truffleAssert.reverts(
            swaparooCore.renounceOwner(),
            "only-owner"
        );
    });
  });
  
  describe('#create-pool', function () {
    it("create pool works", async () => {
      const tx = await swaparooCore.createPool(goldToken.address, silverToken.address);
      
      // correct event emitted
      truffleAssert.eventEmitted(tx, 'PoolAdded', (ev) => {
          return ev['tokenA'] === goldToken.address && ev['tokenB'] === silverToken.address;
      }, 'PoolAdded should be emitted with correct parameters');

      // deploys one contract
      const pools = await swaparooCore.getPools();
      assert(pools.length == 1, "There should be 1 pool existing");

      // deployed contract is of type SwaparooPool
      const newPoolInstance = await SwaparooPool.at(pools[0]);
      await newPoolInstance.getAddressTokenA();
    });
    
    it("create duplicate pool reverts", async () => {
      await swaparooCore.createPool(goldToken.address, silverToken.address);
      // try creating duplicate pools:
      await truffleAssert.reverts(
        swaparooCore.createPool(goldToken.address, silverToken.address),
        "already-exists"
      );
      await truffleAssert.reverts(
        swaparooCore.createPool(silverToken.address, goldToken.address),
        "already-exists"
      );
    });

    it("create mutiple pools works", async () => {
      await swaparooCore.createPool(goldToken.address, silverToken.address);
      await swaparooCore.createPool(goldToken.address, bronzeToken.address);
      await swaparooCore.createPool(bronzeToken.address, silverToken.address);

      const pools = await swaparooCore.getPools();
      assert(pools.length == 3, "There should be 3 pools existing");
    });

    it("only owner can create pools", async () => {
      await truffleAssert.reverts(
        swaparooCore.createPool(goldToken.address, silverToken.address, {from: billy}),
        "unauthorized"
      );
    });
  });
  /*
  describe('#remove-pool', function () {
    it("remove pool works", async () => {
      // create two pools
      await swaparooCore.createPool(goldToken.address, silverToken.address);
      await swaparooCore.createPool(goldToken.address, bronzeToken.address);

      // remove one pool
      await swaparooCore.removePool(goldToken.address, silverToken.address);

      const pools = await swaparooCore.poolsArray.call();
      assert(pools.length == 1, "There should be only 1 pools existing");

      const removedPoolAddress = await swaparooCore.getPoolByTokens(goldToken.address, silverToken.address);
      assert(removedPoolAddress == "0x0000000000000000000000000000000000000000", "Address should be zero address")
    });

    it("remove non-existing pool reverts", async () => {
      // create pool
      await swaparooCore.createPool(goldToken.address, silverToken.address);
      // remove different pool
      await truffleAssert.reverts(
        swaparooCore.removePool(bronzeToken.address, silverToken.address),
        "not-found"
      );
    });

    it("only owner can remove pools", async () => {
      // create two pools
      await swaparooCore.createPool(goldToken.address, silverToken.address);
      await swaparooCore.createPool(goldToken.address, bronzeToken.address);

      await truffleAssert.reverts(
        swaparooCore.removePool(goldToken.address, silverToken.address, {from: billy}),
        "unauthorized"
      );
    });
  });
  */
});

