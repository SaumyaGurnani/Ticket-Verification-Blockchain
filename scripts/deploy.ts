import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  console.log("Deploying EventTicketing...");

  const [deployer] = await ethers.getSigners();
  const contract = await ethers.deployContract("EventTicketing");
  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log("EventTicketing deployed successfully");
  console.log(`Address: ${address}`);
  console.log(`Deployer: ${deployer.address}`);
}

await main().catch((error) => {
  console.error("Deployment failed");
  console.error(error);
  process.exitCode = 1;
});
