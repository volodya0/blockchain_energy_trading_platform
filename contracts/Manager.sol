// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Basic interface definitions for interacting with P2P and M2M contracts
interface IP2P {
    function registerParticipant(address participant, bool isProsumer, uint microgridId, uint initialEnergyBalance) external ;
    function updateEnergyBalance(address participant, uint energyBalance) external returns (int energyBalanceChange) ;
    function tryTradeEnergy(address consumer, uint microgridId, uint amount) external returns (address foundProsumer) ;
}  
 
interface IM2M {
    function isMicrogridRegistered(uint microgridId) external view returns (bool);
    function registerMicrogrid(uint microgridId, int initialEnergyBalance) external;  
    function updateEnergyBalance(uint microgridId, int energyChange) external;
    function findGrid(uint amount) external returns (uint microgridId);
}
 
contract Manager {
    struct Participant {
        bool isRegistered;
        bool isProsumer;
        uint microgridId;
    }

    mapping(address => Participant) public participants;
    IP2P public p2pContract;
    IM2M public m2mContract;

    event ParticipantRegistered(address indexed participant, bool isProsumer, uint microgridId);
    event EnergyRequest(address indexed requester, uint amount, bool isBuying);
    event EnergyTrade(address indexed buyer, address indexed seller, uint amount, uint price);

    constructor(address _p2pContractAddress, address _m2mContractAddress) {
        p2pContract = IP2P(_p2pContractAddress);
        m2mContract = IM2M(_m2mContractAddress);
    }

    modifier onlyRegistered() {
        require(participants[msg.sender].isRegistered, "Not registered");
        _;
    }

    // Register a new participant (prosumer or consumer) with a microgrid ID
    function registerParticipant(bool isProsumer, uint microgridId, int initialEnergyBalance) external {
        require(!participants[msg.sender].isRegistered, "Already registered");
        
        participants[msg.sender] = Participant({
            isRegistered: true,
            isProsumer: isProsumer,
            microgridId: microgridId
        });

        p2pContract.registerParticipant(msg.sender, isProsumer, microgridId, uint(initialEnergyBalance));

        if(m2mContract.isMicrogridRegistered(microgridId) == false){
            m2mContract.registerMicrogrid(microgridId, initialEnergyBalance);
        }else{
            m2mContract.updateEnergyBalance(microgridId, initialEnergyBalance); 
        }

        
        emit ParticipantRegistered(msg.sender, isProsumer, microgridId);
    }

    function updateEnergyBalance(uint energyBalance) external onlyRegistered {
        int energyBalanceChange = p2pContract.updateEnergyBalance(msg.sender, energyBalance);
        m2mContract.updateEnergyBalance(participants[msg.sender].microgridId, energyBalanceChange);
    }

    // Request to buy or sell energy
    function requestEnergy(uint amount, bool isBuying) external onlyRegistered  {
        if (isBuying) {
            // Buying request - find local prosumer first, then microgrid if necessary
            address seller = p2pContract.tryTradeEnergy(msg.sender, participants[msg.sender].microgridId, amount);

            if (seller == address(0)) {
                // No local prosumer, check other microgrids
                uint microGridId = m2mContract.findGrid(amount);
                seller = p2pContract.tryTradeEnergy(msg.sender, microGridId, amount);
            }

            require(seller != address(0), "No energy available to fulfill request");

            uint price = calculatePrice(amount); // Assume a helper function for price calculation
            completeTrade(msg.sender, seller, amount, price);
        } else {
            // Selling request - handle surplus energy updates
            emit EnergyRequest(msg.sender, amount, isBuying);
            // Further implementation for handling surplus can go here
        }
    }

    // Helper function to complete a trade
    function completeTrade(address buyer, address seller, uint amount, uint price) internal {
        // Assume a token transfer mechanism for handling payment
        // For example: ERC20 transfer from buyer to seller
        // Token(tokenAddress).transferFrom(buyer, seller, price);
        
        emit EnergyTrade(buyer, seller, amount, price);
    }

    // Mock function for price calculation
    function calculatePrice(uint amount) private pure returns (uint) {
        // Implement price calculation logic here, e.g., based on demand-supply, utility price, etc.
        return amount * 1 ether; // Simplified for example purposes
    }
}
