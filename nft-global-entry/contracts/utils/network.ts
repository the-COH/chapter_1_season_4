import 'dotenv/config';
export function node_url(networkName: string): string {
  if (networkName) {
    const uri = process.env['ETH_NODE_URI_' + networkName.toUpperCase()];
    if (uri && uri !== '') {
      return uri;
    }
  }

  let uri = process.env.ETH_NODE_URI;
  if (uri) {
    uri = uri.replace('{{networkName}}', networkName);
  }
  if (!uri || uri === '') {
    if (networkName === 'localhost') {
      return 'http://localhost:8545';
    }
    // throw new Error(`environment variable "ETH_NODE_URI" not configured `);
    return '';
  }
  if (uri.indexOf('{{') >= 0) {
    throw new Error(
      `invalid uri or network not supported by nod eprovider : ${uri}`
    );
  }
  return uri;
}

export function getMnemonic(networkName?: string): string {
  if (networkName) {
    const mnemonic = process.env['MNEMONIC_' + networkName.toUpperCase()];
    if (mnemonic && mnemonic !== '') {
      return mnemonic;
    }
  }

  const mnemonic = process.env.MNEMONIC;
  if (!mnemonic || mnemonic === '') {
    return 'test test test test test test test test test test test junk';
  }
  return mnemonic;
}

export function accounts(networkName?: string): {mnemonic: string} {
  return {mnemonic: getMnemonic(networkName)};
}

export async function safeNetworkName(
  chainIds: number[],
  chainId: string
): Promise<string> {
  if (!chainIds.includes(parseInt(chainId))) new Error('Invalid Network');

  return (
    {
      1: 'mainnet',
      5: 'goerli',
      137: 'matic',
      80001: 'mumbai',
      740: 'canto-testnet',
      7700: 'canto-mainnet',
    }[chainId] || Promise.reject('Invalid Network')
  );
}

export function blockExplorerLink({
  address,
  chainId,
  hash,
}: {
  address?: string;
  chainId: string;
  hash?: string;
}) {
  let domain;

  switch (chainId) {
    case '1':
      domain = 'https://etherscan.io';
      break;
    case '5':
      domain = 'https://goerli.etherscan.io';
      break;
    case '137':
      domain = 'https://polygonscan.com';
      break;
    case '80001':
      domain = 'https://mumbai.polygonscan.com';
      break;
    case '740':
      domain = 'https://testnet-explorer.canto.neobase.one';
      break;
    case '7700':
      domain = 'https://evm.explorer.canto.io';
      break;
    default:
      break;
  }

  const path = address ? `/address/${address}` : `/tx/${hash}`;

  return domain + path;
}
