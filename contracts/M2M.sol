// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract M2M {
    struct Microgrid {
        bool isRegistered;
        int energyBalance; // Positive balance indicates surplus, negative indicates deficit
    }

    mapping(uint => Microgrid) public microgrids;

    event MicrogridRegistered(uint indexed microgridId, int initialEnergyBalance);
    event EnergyTransferred(uint indexed fromMicrogrid, uint indexed toMicrogrid, uint amount);

    modifier onlyRegistered(uint microgridId) {
        require(microgrids[microgridId].isRegistered, "Microgrid not registered");
        _;
    }

    // Register a microgrid with an initial energy balance
    function registerMicrogrid(uint microgridId, int initialEnergyBalance) external {
        require(!microgrids[microgridId].isRegistered, "Microgrid already registered");

        microgrids[microgridId] = Microgrid({
            isRegistered: true,
            energyBalance: initialEnergyBalance
        });
        
        emit MicrogridRegistered(microgridId, initialEnergyBalance);
    }

        // Register a microgrid with an initial energy balance
    function isMicrogridRegistered(uint microgridId) external view returns (bool) {
        return microgrids[microgridId].isRegistered;
    }

    // Update the energy balance of a microgrid
    function updateEnergyBalance(uint microgridId, int energyChange) external onlyRegistered(microgridId) {
        microgrids[microgridId].energyBalance += energyChange;
    }

    // Find a microgrid with surplus energy to match the demand of another microgrid
    function findGrid(uint amount) external view returns (uint) {
        int intAmount = int(amount);
        
        for (uint i = 0; i < 100; i++) { // Assuming IDs are sequentially numbered for simplicity
            if (microgrids[i].isRegistered && microgrids[i].energyBalance >= intAmount) {
                return i;
            }
        }
        
        revert("No suitable microgrid with surplus energy found");
    }

    // Transfer energy from one microgrid to another
    function transferEnergy(uint fromMicrogrid, uint toMicrogrid, uint amount) external onlyRegistered(fromMicrogrid) onlyRegistered(toMicrogrid) {
        int intAmount = int(amount);
        
        require(microgrids[fromMicrogrid].energyBalance >= intAmount, "Insufficient energy in source microgrid");

        microgrids[fromMicrogrid].energyBalance -= intAmount;
        microgrids[toMicrogrid].energyBalance += intAmount;

        emit EnergyTransferred(fromMicrogrid, toMicrogrid, amount);
    }
}
