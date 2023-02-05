import {ethers, getChainId} from 'hardhat';
import '@nomiclabs/hardhat-ethers';
import {blockExplorerLink, safeNetworkName} from '~utils/network';

async function main() {
  const {deployer} = await ethers.getNamedSigners();
  const chainId = await getChainId();
  const networkName = await safeNetworkName([740, 7700], chainId);

  const {
    abi: forwarderAbi,
    address: forwarderAddress,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
  } = require(`../deployments/${networkName}/GlobalEntryForwarder.json`);

  const {
    address,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
  } = require(`../deployments/${networkName}/WrasslersPlaySession.json`);

  const Forwarder = await ethers.getContractAt(
    forwarderAbi,
    forwarderAddress,
    deployer
  );

  const tx = await Forwarder.setDelegationRegistry(address);

  console.log(blockExplorerLink({chainId, hash: tx.hash}));

  return tx.wait();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
