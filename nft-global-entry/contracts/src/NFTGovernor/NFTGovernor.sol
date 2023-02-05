// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@0xessential/contracts/fwd/EssentialERC2771Context.sol";
import "@openzeppelin/contracts/governance/Governor.sol";
import "./GovernorCompatibilityNFTGlobalEntry.sol";

contract NFTGovernor is Governor, GovernorCompatibilityNFTGlobalEntry {
    struct Community {
        address contractAddress;
        uint8 chainId;
    }

    Community public community;

    /// @notice Restricted to holders of DEF NFT
    modifier onlyCommunityMember() {
        require(isTrustedForwarder(msg.sender), "Unauthorized");
        IForwardRequest.NFT memory token = _msgNFT();
        require(
            community.chainId == token.chainId && community.contractAddress == token.contractAddress,
            "Unauthorized"
        );
        _;
    }

    constructor(
        address _communityAddress,
        uint8 _chainId,
        address _trustedForwarder
    ) Governor("NFTGovernor") GovernorCompatibilityNFTGlobalEntry(_trustedForwarder) {
        community = Community({contractAddress: _communityAddress, chainId: _chainId});
    }

    function votingDelay() public pure override returns (uint256) {
        return 0; // Voting open immediately - hackathon
    }

    function votingPeriod() public pure override returns (uint256) {
        return 46027; // 1 week
    }

    function proposalThreshold() public pure override returns (uint256) {
        return 0;
    }

    function _msgData() internal view override(Context, GovernorCompatibilityNFTGlobalEntry) returns (bytes calldata) {
        return super._msgData();
    }

    function _msgSender()
        internal
        view
        override(Context, GovernorCompatibilityNFTGlobalEntry)
        returns (address sender)
    {
        return super._msgSender();
    }

    function quorum(uint256) public pure override returns (uint256) {
        return 20;
    }

    function getVotes(address account, uint256 blockNumber) public view override(Governor) returns (uint256) {
        return super.getVotes(account, blockNumber);
    }

    function state(uint256 proposalId) public view override(Governor) returns (ProposalState) {
        return super.state(proposalId);
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(Governor, GovernorCompatibilityNFTGlobalEntry) onlyCommunityMember returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor) onlyForwarder returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor) returns (address) {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId) public view override(Governor) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * One vote per token / holder address
     */
    function _getVotes(
        address, // account
        uint256, //blockNumber
        bytes memory /*params*/
    ) internal pure override returns (uint256) {
        return 1;
    }
}
