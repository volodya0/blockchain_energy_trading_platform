// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract P2P {
    struct Participant {
        bool isRegistered;
        bool isProsumer;
        uint energyBalance; // Tracks available energy for prosumers or required energy for consumers
        uint microgridId;
    }

    mapping(address => Participant) public participants;
    mapping(uint => address[]) public microgridParticipants; // Maps microgrid IDs to lists of participants

    event ParticipantRegistered(address indexed participant, bool isProsumer, uint microgridId);
    event EnergyMatched(address indexed consumer, address indexed prosumer, uint amount);

    // Register a participant as a prosumer or consumer with a specific microgrid ID
    function registerParticipant(address participant, bool isProsumer, uint microgridId, uint initialEnergyBalance) external  {
        require(!participants[participant].isRegistered, "Participant already registered");

        participants[participant] = Participant({
            isRegistered: true,
            isProsumer: isProsumer,
            energyBalance: initialEnergyBalance,
            microgridId: microgridId
        });
        
        microgridParticipants[microgridId].push(participant);
        
        emit ParticipantRegistered(participant, isProsumer, microgridId);
    }

    // Find a prosumer within the same microgrid who can fulfill the energy needs of a consumer
    function tryTradeEnergy(address consumer, uint microgridId, uint amount) external returns (address foundProsumer) {
        // Ensure that the requester is a consumer and has a valid energy requirement
        require(!participants[consumer].isProsumer, "Only consumers can request energy");
        require(participants[consumer].energyBalance == 0, "Consumer already has energy");
        
        address matchedProsumer = address(0);

        for (uint i = 0; i < microgridParticipants[microgridId].length; i++) {
            address prosumer = microgridParticipants[microgridId][i];
            
            // Check if the participant is a registered prosumer with enough energy balance
            if (participants[prosumer].isProsumer && participants[prosumer].energyBalance >= amount) {
                matchedProsumer = prosumer;
                break;
            }
        }

        if(matchedProsumer != address(0)){
            // Update the balances of the consumer and prosumer after matching
            participants[matchedProsumer].energyBalance -= amount;
            participants[consumer].energyBalance += amount;
        }

        return matchedProsumer;
    }

    // Function to update the energy balance of a participant (for testing/demo purposes)
    function updateEnergyBalance(address participant, uint energyBalance) external returns (int) {
        require(participants[participant].isRegistered, "Not registered");
        uint old = participants[participant].energyBalance;
        participants[participant].energyBalance = energyBalance;
        return int(energyBalance) - int(old);
    }
}
