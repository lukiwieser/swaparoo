/**
 * Use this file to configure your truffle project.
 *
 * More information about configuration can be found at:
 * https://trufflesuite.com/docs/truffle/reference/configuration/
 */


require("ts-node").register({
  files: true,
});

module.exports = {
  contracts_build_directory: "./build/contracts/abi",
  // Use optimizer to decrease contract size, since contracts have a size limit.
  compilers: {
    solc: {
      version: '0.8.19',
      settings: {
        optimizer: {
          enabled: true,
          runs: 1500
        }
      }
    }
  },
  /**
   * Networks define how you connect to your ethereum client.
   *
   * You can pass a network to a truffle command by:
   * >>> truffle test --network <network-name>
   *
   * NOTE: For the commands `develop` and `test`, Truffle spins up a local development blockchain on port `9545`.
   * However, by using `develop` or `test` as network names, you can override their settings.
   * More info at: https://trufflesuite.com/docs/truffle/reference/configuration/#special-managed-networks-test-and-develop
   *
   * NOTE: Also be aware of using `development`. If no network option is passed, but a network `development` is specified below,
   * Truffle will use this as default for e.g. `truffle test`. This will fail your remote tests!
   * More info at: https://trufflesuite.com/docs/truffle/reference/configuration/#networks
   */
  networks: {
    ganache: {
      host: "127.0.0.1",
      port: 7545, // e.g. default port of Ganache
      network_id: "*"
    },
  }
};

