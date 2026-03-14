require('dotenv').config();
const { vars } = require('hardhat/config');

module.exports = {
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {},
    amoy: {
      url: vars.get('AMOY_RPC_URL', 'https://rpc-amoy.polygon.technology'),
      chainId: 80002,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    sepolia: {
      url: vars.get('SEPOLIA_RPC_URL', 'https://rpc.sepolia.org'),
      chainId: 11155111,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};
