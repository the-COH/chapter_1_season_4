import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {blockExplorerLink, safeNetworkName} from '../utils/network';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts, getChainId} = hre;
  const {deploy} = deployments;
  const chainId = await getChainId();
  const networkName = await safeNetworkName([740, 7700], chainId);

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Forwarder = require(`../deployments/${networkName}/GlobalEntryForwarder.json`);

  const {deployer, communityAddress} = await getNamedAccounts();

  const deployed = await deploy('NFTGovernor', {
    from: deployer,
    log: true,
    args: [communityAddress, process.env.COMMUNITY_CHAIN_ID, Forwarder.address],
  });

  console.warn(blockExplorerLink({address: deployed.address, chainId}));
};
export default func;
func.tags = ['NFTGovernor'];
