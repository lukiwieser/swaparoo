/**
 * Use this file to configure your truffle project.
 *
 * More information about configuration can be found at:
 * https://trufflesuite.com/docs/truffle/reference/configuration/
 */

const path = require("path");

module.exports = {
  compilers: {
    solc: {
      version: '0.8.19',
    }
  },

  // TODO - Here you can specify the output directory for the compiled ABIs
  // contracts_build_directory: path.join(__dirname, "frontend/abi")

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
    // This network can be used to deploy directly to the LVA-Chain. Check that your Geth-Client is up and running!
    lva: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
  }
};

