import {expect} from 'chai';
import {deployments} from 'hardhat';
import {signMetaTxRequest} from '@0xessential/signers';
import {setupUsers} from './utils';
import {handleOffchainLookup} from './utils/offchainLookupMock';
import {BigNumber, Contract} from 'ethers';
import {
  EssentialForwarder,
  IForwardRequest,
} from '@0xessential/signers/dist/types/typechain/contracts/fwd/EssentialForwarder';
import {NFTGovernor} from '~typechain/src/NFTGovernor/NFTGovernor';
import {keccak256, toUtf8Bytes} from 'ethers/lib/utils';

enum VoteType {
  Against,
  For,
  Abstain,
}

const setupTest = deployments.createFixture(
  async ({getNamedAccounts, ethers}) => {
    const {communityAddress} = await getNamedAccounts();
    const signers = await ethers.getSigners();

    const Forwarder = await ethers.getContractFactory(
      'GlobalEntryForwarder',
      signers[0]
    );
    const fwd = (await Forwarder.deploy([
      'http://localhost:8000',
    ])) as EssentialForwarder;
    await fwd.deployed();

    const NFTGovernor = await ethers.getContractFactory(
      'NFTGovernor',
      signers[0]
    );
    const gov = (await NFTGovernor.deploy(
      communityAddress,
      1,
      fwd.address
    )) as NFTGovernor;
    await gov.deployed();

    const users = (await setupUsers(
      signers.map((signer) => signer.address),
      {
        fwd,
        gov,
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    )) as any[];

    const proposalId = await gov.hashProposal(
      [communityAddress, communityAddress],
      [0, 1],
      ['0x', '0x'],
      keccak256(toUtf8Bytes('Test'))
    );

    return {
      communityAddress,
      fwd,
      proposalId,
      gov,
      users,
    };
  }
);

const submitMetaTx = async (
  forwarder: Contract,
  request: IForwardRequest.ERC721ForwardRequestStruct,
  signature: string
) => {
  return forwarder
    .preflight(request, signature)
    .catch(
      async (
        e: Error & {errorName?: string; errorArgs?: Record<string, unknown>}
      ) => {
        if (e.errorName === 'OffchainLookup' && e.errorArgs) {
          return await handleOffchainLookup(
            e.errorArgs,
            forwarder.signer,
            forwarder
          );
        }
      }
    );
};

let fixtures: {
  communityAddress: string;
  gov: NFTGovernor;
  fwd: EssentialForwarder;
  proposalId: BigNumber;
  users: ({
    address: string;
  } & {
    gov: NFTGovernor;
    fwd: EssentialForwarder;
  })[];
};

describe('NFTGovernor', () => {
  before(async () => {
    fixtures = await setupTest();
  });

  it('Allows public read', async function () {
    const {gov} = fixtures;
    const readResult = await gov.proposalThreshold();
    expect(readResult.toNumber()).to.equal(0);
  });

  describe('propose', () => {
    it('reverts if called outside of forwarder', async function () {
      const {
        communityAddress,
        users: [relayer],
      } = fixtures;

      await expect(
        relayer.gov['propose(address[],uint256[],bytes[],string)'](
          [communityAddress],
          [0, 1],
          ['0x'],
          'Test Proposal'
        )
      ).to.be.revertedWith('Unauthorized');
    });

    it('creates a proposal with valid ownership proof', async function () {
      const {
        communityAddress,
        proposalId,
        users: [relayer, account],
        gov,
      } = fixtures;

      const data = account.gov.interface.encodeFunctionData(
        'propose(address[],uint256[],bytes[],string)',
        [[communityAddress, communityAddress], [0, 1], ['0x', '0x'], 'Test']
      );

      const {signature, request} = await signMetaTxRequest(
        account.gov.provider,
        {
          to: gov.address,
          from: account.address,
          authorizer: account.address,
          nftContract: communityAddress,
          nftChainId: '1',
          nftTokenId: '1',
          targetChainId: '31337',
          data,
        },
        relayer.fwd,
        'GlobalEntryForwarder'
      );

      await submitMetaTx(relayer.fwd, request, signature);

      const proposal = await gov.proposals(proposalId);
      expect(proposal.proposer).to.eq(account.address);
    });
  });

  describe('proposals', () => {
    it('lists proposal IDs', async function () {
      const {gov, proposalId} = fixtures;

      const [id] = await gov.listProposalIds();

      expect(id).to.equal(proposalId);
    });
  });

  describe('castVote', () => {
    it('allows a token holder to vote for', async function () {
      const {
        communityAddress,
        proposalId,
        users: [relayer, account],
        gov,
      } = fixtures;

      const data = account.gov.interface.encodeFunctionData('castVote', [
        proposalId,
        VoteType.For,
      ]);

      const {signature, request} = await signMetaTxRequest(
        account.gov.provider,
        {
          to: gov.address,
          from: account.address,
          authorizer: account.address,
          nftContract: communityAddress,
          nftChainId: '1',
          nftTokenId: '1',
          targetChainId: '31337',
          data,
        },
        relayer.fwd,
        'GlobalEntryForwarder'
      );

      await submitMetaTx(relayer.fwd, request, signature);

      const proposal = await gov.proposals(proposalId);
      expect(proposal.forVotes).to.eq(1);
    });

    it('allows a token holder to vote against', async function () {
      const {
        communityAddress,
        proposalId,
        users: [relayer, _prevAccount, account],
        gov,
      } = fixtures;

      const data = account.gov.interface.encodeFunctionData('castVote', [
        proposalId,
        VoteType.Against,
      ]);

      const {signature, request} = await signMetaTxRequest(
        account.gov.provider,
        {
          to: gov.address,
          from: account.address,
          authorizer: account.address,
          nftContract: communityAddress,
          nftChainId: '1',
          nftTokenId: '2',
          targetChainId: '31337',
          data,
        },
        relayer.fwd,
        'GlobalEntryForwarder'
      );

      await submitMetaTx(relayer.fwd, request, signature);

      const proposal = await gov.proposals(proposalId);
      expect(proposal.againstVotes).to.eq(1);
    });

    it('prevents a token holder from voting twice from same address', async function () {
      const {
        communityAddress,
        proposalId,
        users: [relayer, account],
        gov,
      } = fixtures;

      const data = account.gov.interface.encodeFunctionData('castVote', [
        proposalId,
        VoteType.For,
      ]);

      const {signature, request} = await signMetaTxRequest(
        account.gov.provider,
        {
          to: gov.address,
          from: account.address,
          authorizer: account.address,
          nftContract: communityAddress,
          nftChainId: '1',
          nftTokenId: '3',
          targetChainId: '31337',
          data,
        },
        relayer.fwd,
        'GlobalEntryForwarder'
      );

      submitMetaTx(relayer.fwd, request, signature);

      const proposal = await gov.proposals(proposalId);
      expect(proposal.forVotes).to.eq(1);
    });

    it('prevents a token holder from voting twice with the same token', async function () {
      const {
        communityAddress,
        proposalId,
        users: [relayer, _for, _against, account],
        gov,
      } = fixtures;

      const data = account.gov.interface.encodeFunctionData('castVote', [
        proposalId,
        VoteType.For,
      ]);

      const {signature, request} = await signMetaTxRequest(
        account.gov.provider,
        {
          to: gov.address,
          from: account.address,
          authorizer: account.address,
          nftContract: communityAddress,
          nftChainId: '1',
          nftTokenId: '2',
          targetChainId: '31337',
          data,
        },
        relayer.fwd,
        'GlobalEntryForwarder'
      );

      await submitMetaTx(relayer.fwd, request, signature);

      const proposal = await gov.proposals(proposalId);
      expect(proposal.forVotes).to.eq(1);
    });
  });
});
