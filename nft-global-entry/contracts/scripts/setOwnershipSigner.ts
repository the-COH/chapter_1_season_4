import 'dotenv/config';
import {ethers, getChainId} from 'hardhat';
import '@nomiclabs/hardhat-ethers';
import {blockExplorerLink, safeNetworkName} from '../utils/network';

async function main() {
  const {deployer, ownershipRpcSigner} = await ethers.getNamedSigners();
  const chainId = await getChainId();
  const networkName = await safeNetworkName([7700, 740], chainId);

  const {
    abi: forwarderAbi,
    address: forwarderAddress,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
  } = require(`../deployments/${networkName}/GlobalEntryForwarder.json`);

  const Forwarder = await ethers.getContractAt(
    forwarderAbi,
    forwarderAddress,
    deployer
  );

  const tx = await Forwarder.setOwnershipSigner(ownershipRpcSigner.address);
  console.log(blockExplorerLink({chainId, hash: tx.hash}));

  return tx.wait();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
