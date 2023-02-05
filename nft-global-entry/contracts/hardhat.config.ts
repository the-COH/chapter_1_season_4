import 'dotenv/config';
import {HardhatUserConfig} from 'hardhat/types';
import 'hardhat-deploy';
import '@nomiclabs/hardhat-ethers';
import 'hardhat-gas-reporter';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'solidity-coverage';
import {node_url, accounts} from './utils/network';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.17',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  namedAccounts: {
    member: 0,
    nonMember: 1,
    ownershipRpcSigner: 4,
    deployer: 5,
    communityAddress: '0x3193046D450Dade9ca17F88db4A72230140E64dC',
  },
  // etherscan: {
  //   // apiKey: process.env.ETHERSCAN_API_KEY,
  //   customChains: [
  //     {
  //       network: 'canto-testnet',
  //       chainId: 740,
  //       urls: {
  //         apiURL: 'https://api-goerli.etherscan.io/api',
  //         browserURL: 'https://goerli.etherscan.io',
  //       },
  //     },
  //   ],
  // },
  networks: {
    hardhat: {
      // process.env.HARDHAT_FORK will specify the network that the fork is made from.
      // this line ensure the use of the corresponding accounts
      accounts: accounts(process.env.HARDHAT_FORK),
      forking: process.env.HARDHAT_FORK
        ? {
            url: node_url(process.env.HARDHAT_FORK),
            blockNumber: process.env.HARDHAT_FORK_NUMBER
              ? parseInt(process.env.HARDHAT_FORK_NUMBER)
              : undefined,
          }
        : undefined,
      blockGasLimit: 6721975_000,
    },
    localhost: {
      url: node_url('localhost'),
      accounts: accounts(),
    },
    'canto-testnet': {
      url: 'https://eth.plexnode.wtf/',
      accounts: accounts(),
    },
    'canto-mainnet': {
      url: 'https://canto.slingshot.finance/',
      accounts: accounts(),
    },
  },
  // xdeploy: {
  //   contract: 'GlobalEntryForwarder',
  //   constructorArgsPath: './forwarder_deployment_arguments.js',
  //   salt: 'GlobalEntryForwarder',
  //   signer: process.env.DEPLOYER_PRIVATE_KEY,
  //   networks: ['cantoTestnet', 'cantoMain'],
  //   rpcUrls: ['https://eth.plexnode.wtf/', 'https://canto.slingshot.finance/'],
  // },
  paths: {
    sources: 'src',
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 21,
    enabled: process.env.REPORT_GAS ? true : false,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    maxMethodDiff: 10,
  },
  // typechain: {
  //   outDir: 'typechain',
  //   target: 'ethers-v5',
  // },
  external: process.env.HARDHAT_FORK
    ? {
        deployments: {
          // process.env.HARDHAT_FORK will specify the network that the fork is made from.
          // this line allow it to fetch the deployments from the network being forked from
          hardhat: ['deployments/' + process.env.HARDHAT_FORK],
        },
      }
    : undefined,
};

export default config;
