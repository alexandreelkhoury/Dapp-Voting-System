const Voting = artifacts.require("Voting.sol");
const { BN, expectRevert, expectEvent} = require("@openzeppelin/test-helpers");
const { expect } = require("chai");


contract("Voting", function (accounts) {
    const owner = accounts[0];
    const voter1 = accounts[1];
    const voter2 = accounts[2];
    const notVoter = accounts[3];
    const proposalDescription1 = "first proposal";
    const proposalDescription2 = "second proposal";

    let VotingInstance;

     //Step 1: Registering Voters.
    
    describe("1 --- Registering Voters ---", function () {
        before(async function () {
            VotingInstance = await Voting.new({ from: owner });
        });

        it("should make sure status is at registering voters", async function () {
            currentState = await VotingInstance.workflowStatus();
            expect(currentState).to.be.bignumber.equal(new BN(0));
        });

        it("shouldn't add a voter if it is not the owner", async function() {
            await expectRevert(VotingInstance.addVoter(voter2, { from: voter1 }), "Ownable: caller is not the owner");
        });

        it("should add a voter and emit event", async function() {
            const findEvent = await VotingInstance.addVoter(voter1, { from: owner });
            const voter = await VotingInstance.getVoter(voter1, { from: voter1 });
            expect(voter.isRegistered).to.equal(true);
            expectEvent(findEvent, "VoterRegistered", { voterAddress: voter1 });
        });

        it("shouldn't add a voter if the voter is already registered", async function() {
            await expectRevert(VotingInstance.addVoter(voter1, { from: owner }), "Already registered");
        });

        it("shouldn't add a voter if the workflow status is not set at RegisteringVoters", async function() {
            VotingInstance.startProposalsRegistering({ from: owner });
            await expectRevert(VotingInstance.addVoter(voter2, { from: owner }), "Voters registration is not open yet");
        });
    });

     //Step 2: Proposals Registration Started.
     
    describe("2 --- Proposals Registration Started ---", function () {
        before(async function () {
            VotingInstance = await Voting.new({ from: owner });
            await VotingInstance.addVoter(voter1, { from: owner });
            await VotingInstance.addVoter(voter2, { from: owner });
        });

        it("shouldn't start the proposals registering if it is not the owner", async function() {
            await expectRevert(VotingInstance.startProposalsRegistering({ from: voter1 }),"Ownable: caller is not the owner");
        });

        it("shouldn't add a proposal if the workflow status is not set to startProposalsRegistering", async function() {
            await expectRevert(VotingInstance.addProposal(proposalDescription1, { from: voter1 }),"Proposals are not allowed yet");
        });

        it("should start proposal registration", async function () {
            await VotingInstance.startProposalsRegistering({ from: owner });
            currentState = await VotingInstance.workflowStatus();
            expect(currentState).to.be.bignumber.equal(new BN(1));
        });

        it("shouldn't add a proposal if it is not a voter", async function() {
            await expectRevert(VotingInstance.addProposal(proposalDescription1, { from: notVoter }), "You're not a voter");
        });

        it("should add a proposal and emit event", async function() {
            const findEvent = await VotingInstance.addProposal(proposalDescription1, { from: voter1 });
            const proposal = await VotingInstance.getOneProposal(0, { from: voter1 });
            expect(proposal.description).to.equal(proposalDescription1);
            expectEvent(findEvent, "ProposalRegistered", { proposalId: new BN(0) });
        });

        it("shouldn't start the proposals registering if the workflow status is not set at RegisteringVoters", async function() {
            await expectRevert(VotingInstance.startProposalsRegistering({ from: owner }), "Registering proposals cant be started now");
        });
    });

     // Step 3: Ending Proposals Registrations.
     
    describe("3 --- Ending Proposals Registrations ---", function () {
        before(async function () {
            VotingInstance = await Voting.new({ from: owner });
            await VotingInstance.addVoter(voter1, { from: owner });
        });

        it("shouldn't end the proposals registering if the workflow status is not set at ProposalsRegistrationStarted", async function() {
            await expectRevert(VotingInstance.endProposalsRegistering({ from: owner}),"Registering proposals havent started yet");
        });

        it("shouldn't end the proposals registering if it is not the owner", async function() {
            await VotingInstance.startProposalsRegistering({ from: owner });
            await expectRevert(VotingInstance.endProposalsRegistering({ from: voter1 }), "Ownable: caller is not the owner");
        });

        it("should end proposal registration", async function () {
            await VotingInstance.endProposalsRegistering({from : owner});
            currentState = await VotingInstance.workflowStatus();
            expect(currentState).to.be.bignumber.equal(new BN(2));
        });
    });
    
     //Step 4: Voting Session Started.
     
    describe("4 --- Voting Session Started ---", function () {
        before(async function () {
            VotingInstance = await Voting.new({ from: owner });
            await VotingInstance.addVoter(voter1, { from: owner });
            await VotingInstance.startProposalsRegistering({ from: owner });
            await VotingInstance.addProposal(proposalDescription1, { from: voter1 });
            await VotingInstance.endProposalsRegistering({ from: owner });
        });

        it("shouldn't set a vote if the workflow status is not set at VotingSessionStarted", async function() {
            await expectRevert(VotingInstance.setVote(0, { from: voter1 }),"Voting session havent started yet");
        });

        it("shouldn't start the voting session if it is not the owner", async function() {
            await expectRevert(VotingInstance.startVotingSession({ from: voter1 }),"Ownable: caller is not the owner");
        });

        it("should start voting the voting session", async function () {
            await VotingInstance.startVotingSession();
            currentState = await VotingInstance.workflowStatus();
            expect(currentState).to.be.bignumber.equal(new BN(3));
        });

        // Je teste si on peut 'startVotingSession' si celle-ci à déjà commencer. 
        // Le message revert de la correction n'est donc pas très adapté mais le test passe :)
        it("shouldn't start the voting session if the workflow status is not set at ProposalsRegistrationEnded", async function() {
            await expectRevert(VotingInstance.startVotingSession(), "Registering proposals phase is not finished");
        });

        it("should set a vote and emit event", async function() {
            const findEvent = await VotingInstance.setVote(0, { from: voter1 });
            const voter = await VotingInstance.getVoter(voter1, { from: voter1 });
            const proposal = await VotingInstance.getOneProposal(0, { from: voter1 });
            expect(voter.votedProposalId).to.be.equal('0');
            expect(voter.hasVoted).to.be.equal(true);
            expect(proposal.description).to.be.equal(proposalDescription1);
            expect(proposal.voteCount).to.be.equal('1');
            expectEvent(findEvent, "Voted", { voter: voter1, proposalId: new BN(0) });
        });

        it("shouldn't set a vote if the voter has already voted", async function() {
            await expectRevert(VotingInstance.setVote(0, { from: voter1 }),"You have already voted");
        });

        it("shouldn't set a vote if it is not a voter", async function() {
            await expectRevert(VotingInstance.setVote(0, { from: notVoter }),"You're not a voter");
        });

    });

     // Step 5: Ending Voting Session.
     
     describe("5 --- Ending Voting Session ---", function () {
        before(async function () {
            VotingInstance = await Voting.new({ from: owner });
            await VotingInstance.addVoter(voter1, { from: owner });
            await VotingInstance.startProposalsRegistering({ from: owner });
            await VotingInstance.endProposalsRegistering({ from: owner });
        });

        it("shouldn't end the voting session if the workflow status is not set at VotingSessionStarted", async function() {
            await expectRevert(VotingInstance.endVotingSession(),"Voting session havent started yet");
        });

        it("shouldn't end the voting session if it is not the owner", async function() {
            await VotingInstance.startVotingSession({ from: owner });
            await expectRevert(VotingInstance.endVotingSession({ from: voter1 }),"Ownable: caller is not the owner");
        });
        
        it('should end voting voting session', async () => {
            await VotingInstance.endVotingSession({ from : owner});
            currentState = await VotingInstance.workflowStatus();
            expect(currentState).to.be.bignumber.equal(new BN(4));
        });
    });
     //Step 6: Votes Tallied.
     
    describe("6 --- Votes Tallied ---", function () {
        before(async function () {
            VotingInstance = await Voting.new({ from: owner });
            await VotingInstance.addVoter(voter1, { from: owner });
            await VotingInstance.addVoter(voter2, { from: owner });
            await VotingInstance.startProposalsRegistering({ from: owner });
            await VotingInstance.addProposal(proposalDescription1, { from: voter1 });
            await VotingInstance.addProposal(proposalDescription2, { from: voter2 });
            await VotingInstance.endProposalsRegistering({ from: owner });
            await VotingInstance.startVotingSession({ from: owner });
            await VotingInstance.setVote(1, {from: voter1});
            await VotingInstance.setVote(1, {from: voter2});
        });

        it("shouldn't tally votes if the workflow status is not set at VotingSessionEnded", async function() {
            await expectRevert(VotingInstance.tallyVotes({ from: owner }),"Current status is not voting session ended");
        });

        it("should tally votes and get the winning proposal ID", async function() {
            await VotingInstance.endVotingSession({ from: owner });
            await VotingInstance.tallyVotes({ from: owner });
            const winningProposalID = await VotingInstance.winningProposalID({ from: owner });
            expect(winningProposalID).to.be.bignumber.equal(new BN(1));
        });

        it("shouldn't tally votes if it's note the owner calling the function", async function() {
            await expectRevert(VotingInstance.tallyVotes({ from: voter1 }),"Ownable: caller is not the owner");
        });      
    });
});