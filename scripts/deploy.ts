import { ethers } from "hardhat";

async function main() {
  // Get the contract factories for P2P, M2M, and Manager contracts
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy P2P contract
  const P2P = await ethers.getContractFactory("P2P");
  const p2pContract = await P2P.deploy();
  console.log("P2P contract deployed to:", await p2pContract.getAddress());

  // Deploy M2M contract
  const M2M = await ethers.getContractFactory("M2M");
  const m2mContract = await M2M.deploy();
  console.log("M2M contract deployed to:", await p2pContract.getAddress());

  // Deploy Manager contract with P2P and M2M contract addresses as arguments
  const Manager = await ethers.getContractFactory("Manager");
  const managerContract = await Manager.deploy(await p2pContract.getAddress(), await p2pContract.getAddress());
  console.log("Manager contract deployed to:", await managerContract.getAddress());

  // Return the deployed contract addresses
  return { p2pContract, m2mContract, managerContract };
}

// Run the deployment script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
