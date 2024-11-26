import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require("dotenv").config(); 

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  networks: {
    hardhat: {
      chainId: 1337,
      accounts: new Array(1_000).fill(null).map((_, i) => ({
        privateKey: `0x${(i + 1).toString().padStart(64, '0')}`,
        balance: "1000000000000000000000" // 1000 ETH
      }))
    },

    sepolia: {
      url: process.env.SEPOLIA_RPC_URL, 
      accounts: [process.env.PRIVATE_KEY!], 
    },
  },
};

export default config;
