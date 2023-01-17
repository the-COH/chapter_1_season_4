import 'dotenv/config';
import {ethers, getChainId} from 'hardhat';
import '@nomiclabs/hardhat-ethers';
import {blockExplorerLink, safeNetworkName} from '../utils/network';

async function main() {
  const {deployer} = await ethers.getNamedSigners();
  const chainId = await getChainId();
  const networkName = await safeNetworkName([740, 7700], chainId);

  const {
    address: forwarderAddress,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
  } = require(`../deployments/${networkName}/GlobalEntryForwarder.json`);

  const contracts = [
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require(`../deployments/${networkName}/NFTGovernor.json`),
  ];

  return Promise.all(
    contracts.map(async (contract) => {
      const Contract = await ethers.getContractAt(
        contract.abi,
        contract.address,
        deployer
      );

      const tx = await Contract.setTrustedForwarder(forwarderAddress);

      console.log(blockExplorerLink({chainId, hash: tx.hash}));

      return tx.wait();
    })
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
