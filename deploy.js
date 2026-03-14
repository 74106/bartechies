const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with account:', deployer.address);
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log('Balance:', hre.ethers.formatEther(balance), 'ETH/POL');

  const MetabolicResetRecords = await hre.ethers.getContractFactory('MetabolicResetRecords');
  const contract = await MetabolicResetRecords.deploy();
  if (typeof contract.waitForDeployment === 'function') {
    await contract.waitForDeployment();
  } else {
    await contract.deployed();
  }
  const address = typeof contract.getAddress === 'function' ? await contract.getAddress() : contract.address;
  console.log('MetabolicResetRecords deployed to:', address);
  console.log('Update js/blockchainConfig.js CONTRACT_ADDRESS to:', address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
