import {getChainId} from 'hardhat';
import '@nomiclabs/hardhat-ethers';
import {safeNetworkName} from '../utils/network';
import {Contract, providers} from 'ethers';

async function main() {
  const chainId = await getChainId();
  const networkName = await safeNetworkName([740, 7700], chainId);

  const {
    abi: forwarderAbi,
    address: forwarderAddress,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
  } = require(`../deployments/${networkName}/GlobalEntryForwarder.json`);

  const provider = new providers.JsonRpcProvider(
    'https://canto.slingshot.finance/',
    {
      name: 'canto',
      chainId: 7700,
    }
  );

  const _forwarder = new Contract(forwarderAddress, forwarderAbi, provider);

  const signature =
    '0x3de889b6e9273af8fe988486c362aa4627ee2c4066a08f927a52960eed50e6da101da3bd86e59a2e223927ff0dda97fa7a08eb75f70ad5e29735c9cbda9662c51c';

  const req = {
    value: {type: 'BigNumber', hex: '0x00'},
    gas: 1000000,
    to: '0x46AfBb3808894dc2b966a17a3E67Fe195ADBabc0',
    from: '0x0090720FeD7Fed66eD658118b7B3BB0189D3A495',
    authorizer: '0x0090720FeD7Fed66eD658118b7B3BB0189D3A495',
    nftContract: '0x3193046D450Dade9ca17F88db4A72230140E64dC',
    nonce: '0',
    nftChainId: '1',
    nftTokenId: '78',
    targetChainId: 7700,
    data: '0x7d5e81e2000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000010000000000000000000000003193046d450dade9ca17f88db4a72230140e64dc000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000018557365206f6e636861696e20676f76206f6e2043616e746f0000000000000000',
  };

  const tx = await _forwarder
    .preflight(req, signature)
    .catch(
      async (
        e: Error & {errorName?: string; errorArgs?: Record<string, unknown>}
      ) => {
        if (e.errorName === 'OffchainLookup' && e.errorArgs) {
          console.warn(e);
        }
      }
    );

  console.warn(tx);

  // return tx.wait();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
