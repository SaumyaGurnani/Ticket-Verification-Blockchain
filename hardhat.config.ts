import { configVariable, defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatIgnition from "@nomicfoundation/hardhat-ignition";

export default defineConfig({
  plugins: [hardhatEthers, hardhatIgnition],
  solidity: {
    version: "0.8.28",
  },
  networks: {
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
  },
});
