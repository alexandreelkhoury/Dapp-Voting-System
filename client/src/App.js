import React, { Component } from "react";
import VotingContract from "./contracts/Voting.json";
import getWeb3 from "./getWeb3";
import "./App.css";
import Addresse from "./addresse";

class App extends Component {
  state = {owned:false, voters:[], web3: null, accounts: null, contract: null, workflow: 0, proposals : [], props : [], winningProposalID : 0 };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = VotingContract.networks[networkId];
      const instance = new web3.eth.Contract(
        VotingContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      const owner = await instance.methods.owner().call();
      let workflow = await instance.methods.workflowStatus().call();
      let owned = accounts[0]===owner;

      const voters = await instance.getPastEvents('VoterRegistered', { fromBlock: 0, toBlock: 'latest'})
			const arrayVoters = voters.map(element => element.returnValues.voterAddress);

      const getevents = await instance.getPastEvents('ProposalRegistered', { fromBlock: 0, toBlock: 'latest'})
      var proposals = getevents.map(element => element.returnValues.proposalId);
      var props = getevents.map(element => element.returnValues.description);

      const winningProposalID = await instance.methods.winningProposalID().call();

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.

      this.setState({owned, voters: arrayVoters, web3, accounts, contract: instance, workflow, proposals, props, winningProposalID});
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  startPropRegis = async () => {
    const { accounts, contract, worflow} = this.state;
    await contract.methods.startProposalsRegistering().send({ from: accounts[0] });
    window.location.reload();
  }

  endPropRegis = async () => {
    const { accounts, contract} = this.state;
    await contract.methods.endProposalsRegistering().send({ from: accounts[0] });
    window.location.reload();
  }

  startVotingSession = async () => {
    const { accounts, contract} = this.state;
    await contract.methods.startVotingSession().send({ from: accounts[0] });
    window.location.reload();
  }

  endVotingSession = async () => {
    const { accounts, contract} = this.state;
    await contract.methods.endVotingSession().send({ from: accounts[0] });
    window.location.reload();
  }

  tallyVotes = async () => {
    const { accounts, contract} = this.state;
    await contract.methods.tallyVotes().send({ from: accounts[0] });
    window.location.reload();
  }

  addVoter = async () => {
    const { accounts, contract} = this.state;
    let address=document.getElementById("newVoter").value;
    await contract.methods.addVoter(address).send({ from: accounts[0] });
    window.location.reload();
  }

  removeVoter = async () => {
    const { accounts, contract} = this.state;
    let address=document.getElementById("removeVoter").value;
    await contract.methods.deleteVoter(address).send({ from: accounts[0] });
    window.location.reload();
  }

  addProposal = async () => {
    const { accounts, contract, props} = this.state;
    let proposal =document.getElementById("newProposal").value;
    await contract.methods.addProposal(proposal).send({ from: accounts[0] });
    window.location.reload();
  }

  setVote = async () => {
    const { accounts, contract} = this.state;
    let id =document.getElementById("newVote").value;
    await contract.methods.setVote(id).send({ from: accounts[0] });
    window.location.reload();
  }

  render() {
    const {workflow, proposals,props, winningProposalID}=this.state;
    if (!this.state.web3) {
      return <div className="app">
        <h2>Please connect your wallet then refresh the page.</h2>
      </div>; 
    }
    else if (workflow == 0){
      if(this.state.owned){
        return <div className="app">
          <h1>Wallet connected</h1>
          <Addresse addr={this.state.accounts} />
          <h2>You are the owner</h2>
          <h3>1. Registering Voters</h3>
          <input type="text" id="newVoter" />
          <button onClick={this.addVoter}>Add Voter</button>
          <br />
          <input type="text" id="removeVoter" />
          <button onClick={this.removeVoter}>Remove Voter</button>
          <br />
          <button onClick={this.startPropRegis}>Start Proposals Registeration</button>
        </div>
      }
      else{
        return <div className="app">
        <h1>Wallet connected</h1>
        <Addresse addr={this.state.accounts} />
        <h2>Admin is Registering Voters</h2>
        <h3>Wait for voting session to start.</h3>
      </div>
      }    
    }
    else if (workflow == 1){
      if(this.state.owned){
        return <div className="app">
          <h1>Wallet connected</h1>
          <Addresse addr={this.state.accounts} />
          <h2>You are the owner</h2>
          <h3>2. Proposal Registration Started</h3>
          <input type="text" id="newProposal" />
          <button onClick={this.addProposal}>Submit</button>
          <br />
          <button onClick={this.endPropRegis}>End Proposals Registeration</button>
        </div>
      }
      else {
        return <div className="app">
          <h1>Wallet connected</h1>
          <Addresse addr={this.state.accounts} />
          <h3>2. Proposal Registration Started</h3>
          <input type="text" id="newProposal" />
          <button onClick={this.addProposal}>Submit</button>
          <br />
        </div>
      }
    } 
    else if (workflow == 2){
      if(this.state.owned){
        return <div className="app">
          <h1>Wallet connected</h1>
          <Addresse addr={this.state.accounts} />
          <h2>You are the owner</h2>
          <h3>3. Proposal Registration Ended</h3>
          <h3>{proposals}</h3>
          <h3>{props}</h3>
          <br />
          <button onClick={this.startVotingSession}>Start Voting Session</button>
        </div>
      }
      else {
        return <div className="app">
          <h1>Wallet connected</h1>
          <Addresse addr={this.state.accounts} />
          <br />
          <h3>3. Proposal Registration Ended</h3>
          <h3>Please wait for admin to start voting session</h3>
          <h3>{proposals}</h3>
          <h3>{props}</h3>
        </div>
      }
    }
    else if (workflow == 3){
      if(this.state.owned){
        return <div className="app">
          <h1>Wallet connected</h1>
          <Addresse addr={this.state.accounts} />
          <h2>You are the owner</h2>
          <h3>4. Voting Session Started</h3>
          <br />
          <input type="number" id="newVote" />
          <button onClick={this.setVote}>Set Vote</button>
          <button onClick={this.endVotingSession}>End Voting Session</button>
          <h2>Votez pour un nombre ci-dessous</h2>
          <h3>{proposals}</h3>
          <h3>{props}</h3>
        </div>
      }
      else {
        return <div className="app">
          <h1>Wallet connected</h1>
          <Addresse addr={this.state.accounts} />
          <br />
          <h3>4. Voting Session Started</h3>
          <h4>Please Vote for a number below</h4>
          <h3>{proposals}</h3>
          <h3>{props}</h3>
          <input type="number" id="newVote" />
          <button onClick={this.setVote}>Set Vote</button>
        </div>
      }
    }
    else if (workflow == 4){
      if(this.state.owned){
        return <div className="app">
          <h1>Wallet connected</h1>
          <Addresse addr={this.state.accounts} />
          <h2>You are the owner</h2>
          <h3>5. Voting Session Ended</h3>
          <br />
          <button onClick={this.tallyVotes}>Tally Votes</button>
        </div>
      }
      else {
        return <div className="app">
          <h1>Wallet connected</h1>
          <Addresse addr={this.state.accounts} />
          <br />
          <h3>5. Voting Session Ended</h3>
          <h4>Please wait for admin to tally votes</h4>
        </div>
      }
    }
    else if (workflow == 5){
      if(this.state.owned){
        return <div className="app">
          <h1>Wallet connected</h1>
          <Addresse addr={this.state.accounts} />
          <h2>You are the owner</h2>
          <h3>Votes Tallied</h3>
          <br />
          <h2>Wining proposal ID : {winningProposalID}</h2>
        </div>
      }
      else {
        return <div className="app">
          <h1>Wallet connected</h1>
          <Addresse addr={this.state.accounts} />
          <br />
          <h4>Votes tallied</h4>
          <h2>Wining proposal ID : {winningProposalID}</h2>
        </div>
      };
    }
  }
}

export default App;
