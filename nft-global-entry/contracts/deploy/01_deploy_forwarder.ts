import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {blockExplorerLink, safeNetworkName} from '../utils/network';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts, getChainId} = hre;
  const {deploy} = deployments;
  const chainId = await getChainId();
  await safeNetworkName([740, 7700], chainId);

  const {deployer} = await getNamedAccounts();

  const deployed = await deploy('GlobalEntryForwarder', {
    from: deployer,
    log: true,
    args: [[process.env.OWNERSHIP_RPC]],
  });

  console.warn(blockExplorerLink({address: deployed.address, chainId}));
};
export default func;
func.tags = ['Forwarder'];
