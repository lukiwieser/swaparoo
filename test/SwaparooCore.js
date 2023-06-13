const truffleAssert = require('truffle-assertions');

const SwaparooCore = artifacts.require("SwaparooCore");

contract("SwaparooCore", async accounts => {
  let swaparooCore;
  let owner = accounts[0];
  let billy = accounts[1]

  async function deployAndInit() {
    // deployed behaves like a singleton. It will look if there is already an instance of the contract deployed to the blockchain via deployer.deploy. The information about which contract has which address on which network is stored in the build folder. new will always create a new instance. [https://ethereum.stackexchange.com/questions/42094/should-i-use-new-or-deployed-in-truffle-unit-tests]
    // Note: "owner" will have the initial balance
    swaparooCore = await SwaparooCore.new();
  }

  beforeEach("deploy and init", async () => {
    await deployAndInit();
  });

  describe('#access-control', function () {
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

    it("owner cannot renounce, if they are the only owner", async () => {
        await truffleAssert.reverts(
            swaparooCore.renounceOwner(),
            "Cannot renounce owner if they are the only owner"
        );
    });
  });
});

