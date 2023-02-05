// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../../lib/forge-std/src/Test.sol";
import {SigUtils} from "./utils/SigUtils.sol";

import "@0xessential/contracts/fwd/IForwardRequest.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/governance/IGovernor.sol";

import {GlobalEntryForwarder} from "../../src/GlobalEntryForwarder/GlobalEntryForwarder.sol";
import {NFTGovernor} from "../../src/NFTGovernor/NFTGovernor.sol";

contract NFTGovernorTest is Test {
    using ECDSA for bytes32;

    NFTGovernor internal governor;
    GlobalEntryForwarder internal forwarder;
    SigUtils internal sigUtils;

    address communityAddress = address(0x3193046D450Dade9ca17F88db4A72230140E64dC);

    uint256 internal eoaPrivateKey;
    address internal eoa;
    uint256 internal eoaNonce;

    uint256 internal ownershipSignerPrivateKey;
    address internal ownershipSigner;
    string[] internal urls;

    function setUp() public {
        eoaPrivateKey = 0xC11CE;
        eoa = vm.addr(eoaPrivateKey);

        ownershipSignerPrivateKey = 0xB12CE;
        ownershipSigner = vm.addr(ownershipSignerPrivateKey);

        forwarder = new GlobalEntryForwarder(urls);
        governor = new NFTGovernor(communityAddress, 1, address(forwarder));

        sigUtils = new SigUtils(forwarder, address(governor), ownershipSignerPrivateKey, eoaPrivateKey);

        forwarder.setOwnershipSigner(ownershipSigner);
    }

    // Convenience functions for Global Entry meta-transaction
    // 1. Construct EIP-712 request
    // 2. Sign request with eoa private key
    // 3. Mock ownership proof signature
    // 4. Encode extra calldata for idempotency + timeliness checks
    // 5. Submit meta-transaction to forwarder
    function prepareMetaTxRequest(bytes memory func)
        internal
        returns (IForwardRequest.ERC721ForwardRequest memory req, bytes memory sig)
    {
        req = sigUtils.buildRequest(func, eoa, eoa, communityAddress);
        sig = sigUtils.signRequest(req);
    }

    function metaTx(bytes memory func) internal {
        (IForwardRequest.ERC721ForwardRequest memory req, bytes memory sig) = prepareMetaTxRequest(func);

        bytes memory response = sigUtils.mockOwnershipSig(req);
        bytes memory data = abi.encode(block.timestamp, req, sig);

        forwarder.executeWithProof(response, data);
    }

    // Convenience function for building valid proposal args
    function mockProposal()
        internal
        view
        returns (
            address[] memory,
            uint256[] memory,
            bytes[] memory
        )
    {
        address[] memory targets = new address[](1);
        targets[0] = communityAddress;

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = bytes("");

        return (targets, values, calldatas);
    }

    // We use EIP-3668 OffchainLookup for trust-minimized cross-chain token gating.
    // The forwarding contract will revert with an OffchainLookup error in the
    // "happy path" - the revert is expected and has params needed for completing the
    // OffchainLookup and re-submitting the transaction
    function testProposePreflight() public {
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas) = mockProposal();

        bytes memory propose = abi.encodeWithSelector(
            bytes4(keccak256("propose(address[],uint256[],bytes[],string)")),
            targets,
            values,
            calldatas,
            "New proposal"
        );

        (IForwardRequest.ERC721ForwardRequest memory request, bytes memory sig) = prepareMetaTxRequest(propose);

        bytes memory callData = abi.encode(
            request.from,
            request.authorizer,
            request.nonce,
            request.nftChainId,
            request.nftContract,
            request.nftTokenId,
            block.chainid,
            block.timestamp
        );

        vm.expectRevert(
            abi.encodeWithSignature(
                "OffchainLookup(address,string[],bytes,bytes4,bytes)",
                forwarder,
                urls,
                callData,
                forwarder.executeWithProof.selector,
                abi.encode(block.timestamp, request, sig)
            )
        );
        forwarder.preflight(request, sig);
    }

    // If we know that GlobalEntryForwarder#preflight reverts with OffchainLookup
    // and the expected params, we can mock the offchain ownership proof to test
    // NFTGovernor as an NFTGlobalEntry consumer independent of the NFT contract
    // or offchain infrastructure
    function testProposeExecuteWithProof(string calldata description) public {
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas) = mockProposal();

        bytes memory propose = abi.encodeWithSelector(
            bytes4(keccak256("propose(address[],uint256[],bytes[],string)")),
            targets,
            values,
            calldatas,
            description
        );

        metaTx(propose);

        uint256 id = governor.hashProposal(targets, values, calldatas, keccak256(bytes(description)));

        (, address proposer, , , , , , , , , ) = governor.proposals(id);

        assertEq(proposer, eoa);
    }
}
