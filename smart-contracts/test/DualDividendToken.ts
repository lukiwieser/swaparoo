import { GLDTokenInstance, SILTokenInstance, SimpleDualDividendTokenInstance } from '../types/truffle-contracts';

const GLDToken = artifacts.require("GLDToken");
const SILToken = artifacts.require("SILToken");
const SimpleDualDividendToken = artifacts.require("SimpleDualDividendToken");

contract("DualDividendToken", async accounts => {
    // contracts:
    let goldToken: GLDTokenInstance;
    let silverToken: SILTokenInstance;
    let dividendToken: SimpleDualDividendTokenInstance;

    // accounts:
    const owner = accounts[0];
    const alice = accounts[1];
    const billy = accounts[2];

    async function deployAndInit() {
        // deployed behaves like a singleton. It will look if there is already an instance of the contract deployed to the blockchain via deployer.deploy. The information about which contract has which address on which network is stored in the build folder. new will always create a new instance. [https://ethereum.stackexchange.com/questions/42094/should-i-use-new-or-deployed-in-truffle-unit-tests]
        // Note: "owner" will have the initial balance
        goldToken = await GLDToken.new(web3.utils.toBN('10000000000000000000'));
        silverToken = await SILToken.new(web3.utils.toBN('10000000000000000000'));
        dividendToken = await SimpleDualDividendToken.new(goldToken.address, silverToken.address);
    }

    beforeEach("deploy and init", async () => {
        await deployAndInit();
    });
  
    describe('#basic-functionalities', function () {
        it("distribute dividends of tokenA works", async () => {
            await dividendToken.mint(100, {from: alice});
            await dividendToken.mint(200, {from: billy});

            // Add profits
            const amountGoldProfits = web3.utils.toBN('1000000000000000000');
            await goldToken.approve(dividendToken.address, amountGoldProfits);
            await dividendToken.receiveProfits(amountGoldProfits, goldToken.address);
            
            // Check Alice's Dividends
            const dividendsAlice = await dividendToken.getAndUpdateDividends.call({from: alice});
            const dividendsGoldAlice = dividendsAlice['0'];
            const dividendsSilverAlice = dividendsAlice['1'];
 
            const dividendsGoldAliceExpected = web3.utils.toBN("333333333333333333");
            const dividendsSilverAliceExpected = web3.utils.toBN("0");
            assert(dividendsGoldAlice.eq(dividendsGoldAliceExpected), "Alice's gold dividends are wrong");
            assert(dividendsSilverAlice.eq(dividendsSilverAliceExpected), "Alice's silver dividends are wrong");
        
            // Check Billy's Dividends
            const dividendsBilly = await dividendToken.getAndUpdateDividends.call({from: billy});
            const dividendsGoldBilly = dividendsBilly['0'];
            const dividendsSilverBilly = dividendsBilly['1'];
            
            const dividendsGoldBillyExpected = web3.utils.toBN("666666666666666666");
            const dividendsSilverBillyExpected = web3.utils.toBN("0");
            assert(dividendsGoldBilly.eq(dividendsGoldBillyExpected), "Billy's gold dividends are wrong");
            assert(dividendsSilverBilly.eq(dividendsSilverBillyExpected), "Billy's silver dividends are wrong");
        });

        it("distribute dividends of tokenB works", async () => {
            await dividendToken.mint(100, {from: alice});
            await dividendToken.mint(200, {from: billy});

            // Add profits
            const amountSilverProfits = web3.utils.toBN('1000000000000000000');
            await silverToken.approve(dividendToken.address, amountSilverProfits);
            await dividendToken.receiveProfits(amountSilverProfits, silverToken.address);
            
            // Check Alice's Dividends
            const dividendsAlice = await dividendToken.getAndUpdateDividends.call({from: alice});
            const dividendsGoldAlice = dividendsAlice['0'];
            const dividendsSilverAlice = dividendsAlice['1'];
 
            const dividendsGoldAliceExpected = web3.utils.toBN("0");
            const dividendsSilverAliceExpected = web3.utils.toBN("333333333333333333");
            assert(dividendsGoldAlice.eq(dividendsGoldAliceExpected), "Alice's gold dividends are wrong");
            assert(dividendsSilverAlice.eq(dividendsSilverAliceExpected), "Alice's silver dividends are wrong");
        
            // Check Billy's Dividends
            const dividendsBilly = await dividendToken.getAndUpdateDividends.call({from: billy});
            const dividendsGoldBilly = dividendsBilly['0'];
            const dividendsSilverBilly = dividendsBilly['1'];
            
            const dividendsGoldBillyExpected = web3.utils.toBN("0");
            const dividendsSilverBillyExpected = web3.utils.toBN("666666666666666666");
            assert(dividendsGoldBilly.eq(dividendsGoldBillyExpected), "Billy's gold dividends are wrong");
            assert(dividendsSilverBilly.eq(dividendsSilverBillyExpected), "Billy's silver dividends are wrong");
        });

        it("payout dividends works", async () => {
            await dividendToken.mint(100, {from: alice});
            await dividendToken.mint(200, {from: billy});

            // Add profits asset0 (gold)
            const amountGoldProfits = web3.utils.toBN('2000000000000000000');
            await goldToken.approve(dividendToken.address, amountGoldProfits);
            await dividendToken.receiveProfits(amountGoldProfits, goldToken.address);

            // Add profits asset1 (silver)
            const amountSilverProfits = web3.utils.toBN('1000000000000000000');
            await silverToken.approve(dividendToken.address, amountSilverProfits);
            await dividendToken.receiveProfits(amountSilverProfits, silverToken.address);
            
            // Record Alice's balance before
            const goldBeforeAlice = await goldToken.balanceOf(alice);
            const silverBeforeAlice = await silverToken.balanceOf(alice);

            // Payout Alice's dividends
            await dividendToken.payoutDividends({from: alice});

            // Record Alice's balance after
            const goldAfterAlice = await goldToken.balanceOf(alice);
            const silverAfterAlice = await silverToken.balanceOf(alice);
            
            // Check balances
            const goldAliceExpected = goldBeforeAlice.add(web3.utils.toBN("666666666666666666"));
            const silverAliceExpected = silverBeforeAlice.add(web3.utils.toBN("333333333333333333"));
            assert(goldAfterAlice.eq(goldAliceExpected), "Alice's gold balance is wrong");
            assert(silverAfterAlice.eq(silverAliceExpected), "Alice's silver balance is wrong");
        });
    });

    describe('#sideeffects-between-distributions', function () {
        it("update dividends between distribution has no sideeffects", async () => {
            await dividendToken.mint(100, {from: alice});
            await dividendToken.mint(200, {from: billy});

            // Add profits
            const amountSilverProfits = web3.utils.toBN('500000000000000000');
            await silverToken.approve(dividendToken.address, amountSilverProfits);
            await dividendToken.receiveProfits(amountSilverProfits, silverToken.address);
            
            // Payout Alice's Dividends
            await dividendToken.payoutDividends({from: alice});

            // Add profits
            const amountSilverProfits2 = web3.utils.toBN('500000000000000000');
            await silverToken.approve(dividendToken.address, amountSilverProfits2);
            await dividendToken.receiveProfits(amountSilverProfits2, silverToken.address);

            // Check Alice's Dividends
            const {'0': dividendsGoldAlice, '1': dividendsSilverAlice} = await dividendToken.getAndUpdateDividends.call({from: alice});
            const dividendsGoldAliceExpected = web3.utils.toBN("0");
            const dividendsSilverAliceExpected = web3.utils.toBN("166666666666666666");
            assert(dividendsGoldAlice.eq(dividendsGoldAliceExpected), "Alice's gold dividends are wrong");
            assert(dividendsSilverAlice.eq(dividendsSilverAliceExpected), "Alice's silver dividends are wrong");
        
            // Check Billy's Dividends
            const {'0': dividendsGoldBilly, '1': dividendsSilverBilly} = await dividendToken.getAndUpdateDividends.call({from: billy});
            const dividendsGoldBillyExpected = web3.utils.toBN("0");
            const dividendsSilverBillyExpected = web3.utils.toBN("666666666666666666");
            assert(dividendsGoldBilly.eq(dividendsGoldBillyExpected), "Billy's gold dividends are wrong");
            assert(dividendsSilverBilly.eq(dividendsSilverBillyExpected), "Billy's silver dividends are wrong");
        });

        it("payout dividends between distribution has no sideeffects", async () => {
            await dividendToken.mint(100, {from: alice});
            await dividendToken.mint(200, {from: billy});

            // Add profits
            const amountSilverProfits = web3.utils.toBN('500000000000000000');
            await silverToken.approve(dividendToken.address, amountSilverProfits);
            await dividendToken.receiveProfits(amountSilverProfits, silverToken.address);
            
            // Update Alice's Dividends
            await dividendToken.getAndUpdateDividends.call({from: alice});

            // Add profits
            const amountSilverProfits2 = web3.utils.toBN('500000000000000000');
            await silverToken.approve(dividendToken.address, amountSilverProfits2);
            await dividendToken.receiveProfits(amountSilverProfits2, silverToken.address);

            // Check Alice's Dividends
            const {'0': dividendsGoldAlice, '1': dividendsSilverAlice} = await dividendToken.getAndUpdateDividends.call({from: alice});
            const dividendsGoldAliceExpected = web3.utils.toBN("0");
            const dividendsSilverAliceExpected = web3.utils.toBN("333333333333333333");
            assert(dividendsGoldAlice.eq(dividendsGoldAliceExpected), "Alice's gold dividends are wrong");
            assert(dividendsSilverAlice.eq(dividendsSilverAliceExpected), "Alice's silver dividends are wrong");
        
            // Check Billy's Dividends
            const {'0': dividendsGoldBilly, '1': dividendsSilverBilly} = await dividendToken.getAndUpdateDividends.call({from: billy});
            const dividendsGoldBillyExpected = web3.utils.toBN("0");
            const dividendsSilverBillyExpected = web3.utils.toBN("666666666666666666");
            assert(dividendsGoldBilly.eq(dividendsGoldBillyExpected), "Billy's gold dividends are wrong");
            assert(dividendsSilverBilly.eq(dividendsSilverBillyExpected), "Billy's silver dividends are wrong");
        });

        it("mint/burn between distributions has no sideeffects", async () => {
            await dividendToken.mint(100, {from: alice});
            await dividendToken.mint(200, {from: billy});

            // Add profits
            const amountSilverProfits = web3.utils.toBN('1000000000000000000');
            await silverToken.approve(dividendToken.address, amountSilverProfits);
            await dividendToken.receiveProfits(amountSilverProfits, silverToken.address);
            
            // Mint tokens for Alice's
            await dividendToken.mint(100, {from: alice});

            // Add profits
            const amountSilverProfits2 = web3.utils.toBN('1000000000000000000');
            await silverToken.approve(dividendToken.address, amountSilverProfits2);
            await dividendToken.receiveProfits(amountSilverProfits2, silverToken.address);

            // Burn tokens from Billy
            await dividendToken.burn(200, {from: billy});

            // Add profits
            const amountSilverProfits3 = web3.utils.toBN('1000000000000000000');
            await silverToken.approve(dividendToken.address, amountSilverProfits3);
            await dividendToken.receiveProfits(amountSilverProfits3, silverToken.address);

            // Check Alice's Dividends
            const {'0': dividendsGoldAlice, '1': dividendsSilverAlice} = await dividendToken.getAndUpdateDividends.call({from: alice});
            const dividendsGoldAliceExpected = web3.utils.toBN("0");
            const dividendsSilverAliceExpected = web3.utils.toBN("1833333333333333333"); // 1000000000000000000*(100/300) + 1000000000000000000*(200/400) + 1000000000000000000*(200/200)
            assert(dividendsGoldAlice.eq(dividendsGoldAliceExpected), "Alice's gold dividends are wrong");
            assert(dividendsSilverAlice.eq(dividendsSilverAliceExpected), "Alice's silver dividends are wrong");
        
            // Check Billy's Dividends
            const {'0': dividendsGoldBilly, '1': dividendsSilverBilly} = await dividendToken.getAndUpdateDividends.call({from: billy});
            const dividendsGoldBillyExpected = web3.utils.toBN("0");
            const dividendsSilverBillyExpected = web3.utils.toBN("1166666666666666666"); // 1000000000000000000*(200/300) + 1000000000000000000*(200/400) + 1000000000000000000*(0/200)
            assert(dividendsGoldBilly.eq(dividendsGoldBillyExpected), "Billy's gold dividends are wrong");
            assert(dividendsSilverBilly.eq(dividendsSilverBillyExpected), "Billy's silver dividends are wrong");
        });

        it("transfer between distributions has no sideeffects", async () => {
            await dividendToken.mint(100, {from: alice});
            await dividendToken.mint(200, {from: billy});

            // Add profits
            const amountSilverProfits = web3.utils.toBN('1000000000000000000');
            await silverToken.approve(dividendToken.address, amountSilverProfits);
            await dividendToken.receiveProfits(amountSilverProfits, silverToken.address);
            
            // Transfer tokens from Alice to Billy
            await dividendToken.transfer(billy, 50, {from: alice});

            // Add profits
            const amountSilverProfits2 = web3.utils.toBN('1000000000000000000');
            await silverToken.approve(dividendToken.address, amountSilverProfits2);
            await dividendToken.receiveProfits(amountSilverProfits2, silverToken.address);

            // Check Alice's Dividends
            const {'0': dividendsGoldAlice, '1': dividendsSilverAlice} = await dividendToken.getAndUpdateDividends.call({from: alice});
            const dividendsGoldAliceExpected = web3.utils.toBN("0");
            // Attention! We use floor since due to rounding errors that happen with solidities uint
            const dividendsSilverAliceExpected = web3.utils.toBN("499999999999999999"); // Floor[1000000000000000000*(100/300)] + Floor[1000000000000000000*(50/300)]
            assert(dividendsGoldAlice.eq(dividendsGoldAliceExpected), "Alice's gold dividends are wrong");
            assert(dividendsSilverAlice.eq(dividendsSilverAliceExpected), "Alice's silver dividends are wrong");
        
            // Check Billy's Dividends
            const {'0': dividendsGoldBilly, '1': dividendsSilverBilly} = await dividendToken.getAndUpdateDividends.call({from: billy});
            const dividendsGoldBillyExpected = web3.utils.toBN("0");
            const dividendsSilverBillyExpected = web3.utils.toBN("1499999999999999999"); // Floor[11000000000000000000*(200/300)] + Floor[1000000000000000000*(250/300)]
            assert(dividendsGoldBilly.eq(dividendsGoldBillyExpected), "Billy's gold dividends are wrong");
            assert(dividendsSilverBilly.eq(dividendsSilverBillyExpected), "Billy's silver dividends are wrong");
        });
    });
});

