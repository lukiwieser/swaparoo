const truffleAssert = require('truffle-assertions');

const GLDToken = artifacts.require("GLDToken");
const SILToken = artifacts.require("SILToken");
const SimpleDividendToken = artifacts.require("SimpleDividendToken");

contract("DualDividendToken", async accounts => {
    // contracts:
    let goldToken;
    let silverToken;
    let dividendToken;

    // accounts:
    const owner = accounts[0];
    const alice = accounts[1];
    const billy = accounts[2];

    async function deployAndInit() {
        // deployed behaves like a singleton. It will look if there is already an instance of the contract deployed to the blockchain via deployer.deploy. The information about which contract has which address on which network is stored in the build folder. new will always create a new instance. [https://ethereum.stackexchange.com/questions/42094/should-i-use-new-or-deployed-in-truffle-unit-tests]
        // Note: "owner" will have the initial balance
        goldToken = await GLDToken.new(web3.utils.toBN('10000000000000000000'));
        silverToken = await SILToken.new(web3.utils.toBN('10000000000000000000'));
        dividendToken = await SimpleDividendToken.new(goldToken.address, silverToken.address);
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
});

