import { BRZTokenInstance, GLDTokenInstance, SILTokenInstance, SwaparooCoreInstance } from "../build/contracts/types";

const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const GLDToken = artifacts.require("GLDToken");
const SILToken = artifacts.require("SILToken");
const BRZToken = artifacts.require("BRZToken");
const SwaparooCore = artifacts.require("SwaparooCore");
const SwaparooPool = artifacts.require("SwaparooPool");

contract("SwaparooCore", async accounts => {
    // contracts:
    let goldToken: GLDTokenInstance;
    let silverToken: SILTokenInstance;
    let bronzeToken: BRZTokenInstance;
    let swaparooCore: SwaparooCoreInstance;

    // accounts:
    const owner = accounts[0];
    const billy = accounts[1];
    const alice = accounts[2];
 
    beforeEach("deploy and init", async () => {
        // deployed behaves like a singleton. It will look if there is already an instance of the contract deployed to the blockchain via deployer.deploy. The information about which contract has which address on which network is stored in the build folder. new will always create a new instance. [https://ethereum.stackexchange.com/questions/42094/should-i-use-new-or-deployed-in-truffle-unit-tests]
        // "owner" will have the initial balance of the tokens
        goldToken = await GLDToken.new(web3.utils.toBN('10000000000000000000'));
        silverToken = await SILToken.new(web3.utils.toBN('10000000000000000000'));
        bronzeToken = await BRZToken.new(web3.utils.toBN('10000000000000000000'));
        swaparooCore = await SwaparooCore.new();
    });
        
    describe('#manage-role-owner', function () {
        it("owner should be set after contract creation", async () => {
            assert(await swaparooCore.isOwner(owner));
        });
        
        it("owner can grant others role of owner", async () => {
            const result = await swaparooCore.addOwner(billy);
            
            expectEvent(result, 'OwnerAdded', {
                account: billy,
            });
        });
        
        it("owner can renounce, if there are other owners", async () => {
            await swaparooCore.addOwner(billy);
            
            const result = await swaparooCore.renounceOwner();
            
            expectEvent(result, 'OwnerRemoved', {
                account: owner,
            });
            
            assert(!await swaparooCore.isOwner(owner));
        });
        
        it("others cannot add owners", async () => {
            await expectRevert(
                swaparooCore.addOwner(billy, {from: alice}),
                "unauthorized"
            );
        });
        
        it("owner cannot renounce, if they are the only owner", async () => {
            await expectRevert(
                swaparooCore.renounceOwner(),
                "only-owner"
            );
        });
        
    });
    
    describe('#create-pool', function () {
        it("create pool works", async () => {
            const tx = await swaparooCore.createPool(goldToken.address, silverToken.address);
            
            // correct event emitted
            expectEvent(tx, 'PoolAdded', {
                tokenA: goldToken.address,
                tokenB: silverToken.address,
            });
            
            // deploys one contract
            const pools = await swaparooCore.getPools();
            assert(pools.length == 1, "There should be 1 pool existing");
            
            // test if contract is of type SwaparooPool, by calling a function
            const newPoolInstance = await SwaparooPool.at(pools[0]);
            await newPoolInstance.getReserves();
        });
        
        it("create duplicate pool reverts", async () => {
            await swaparooCore.createPool(goldToken.address, silverToken.address);
            // try creating duplicate pools:
            await expectRevert(
                swaparooCore.createPool(goldToken.address, silverToken.address),
                "already-exists"
            );
            await expectRevert(
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
            await expectRevert(
                swaparooCore.createPool(goldToken.address, silverToken.address, {from: billy}),
                "unauthorized"
            );
        });
    });
});