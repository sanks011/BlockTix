require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      chainId: 1337
    },
    // Add testnet configurations if needed
    // goerli: {
    //   url: `https://goerli.infura.io/v3/${process.env.INFURA_ID}`,
    //   accounts: [process.env.PRIVATE_KEY]
    // }
  }
};