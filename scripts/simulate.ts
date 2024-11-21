const { ethers } = require("hardhat");

// async function simulate() {
//     const [deployer, ...participants] = await ethers.getSigners();

//     const Manager = await ethers.getContractFactory("Manager");
//     const manager = await Manager.attach("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");

//     // await manager.connect(participants[0]).registerParticipant(true, 0, 123);

//     console.log("Starting simulation...");

//     // Simulate registration
//     for (let i = 0; i < 15; i++) {
//         const participant = participants[i];
//         const isProsumer = i % 2 === 0; // Alternate between prosumer and consumer
//         const microgridId = Math.floor(i / 10); // Assign microgrid IDs in batches
//         const initialEnergyBalance = isProsumer ? 100 : 0;

//         await manager
//             .connect(participant)
//             .registerParticipant(isProsumer, microgridId, initialEnergyBalance);

//         console.log(
//             `Participant ${i + 1} registered: Prosumer=${isProsumer}, Microgrid=${microgridId}, Balance=${initialEnergyBalance}`
//         );
//     }

//     // Simulate energy requests
//     for (let i = 0; i < 15; i++) {
//         const buyer = participants[i];
//         const amount = Math.floor(Math.random() * 50) + 1;

//         await manager.connect(buyer).requestEnergy(amount, true); // Simulate buying

//         console.log(`Energy request: Buyer ${i + 1}, Amount=${amount}`);
//     }

//     console.log("Simulation complete.");
// }

simulate().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

async function simulate() {
    console.log("Starting simulation...");

    const users = await ethers.getSigners();
    const totalUsers = users.length;

    const provider = ethers.provider;

    const startBlock = await provider.getBlockNumber();


        const Manager = await ethers.getContractFactory("Manager");
    const manager = await Manager.attach("0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9");




    const microgridCount = 50;
    const participants = [];
    const actions = ["updateBalance", "tradeEnergy"];
    const report = {
        totalConsumers: 0,
        totalProsumers: 0,
        balanceUpdates: 0,
        successfulTrades: 0,
        failedTrades: 0,
        metadata: {
            blockCount: 0,
            totalGasUsed: 0,
        },
        logs: [] as string[],
    };

    for (let i = 0; i < totalUsers; i++) {
        const user = users[i];
        const isProsumer = Math.random() < 0.5;
        const microgridId = Math.floor(Math.random() * microgridCount) + 1;
        const initialEnergyBalance = isProsumer
            ? Math.floor(Math.random() * 100) + 50
            : 0;

        try {
            await manager
                .connect(user)
                .registerParticipant(isProsumer, microgridId, initialEnergyBalance);

            participants.push({ address: user.address, isProsumer, microgridId });
            if (isProsumer) report.totalProsumers++;
            else report.totalConsumers++;

            report.logs.push(
                `Registered ${user.address} as ${
                    isProsumer ? "prosumer" : "consumer"
                } in microgrid ${microgridId} with initial balance ${initialEnergyBalance}.`
            );
        } catch (error: any) {
            report.logs.push(`Failed to register user ${user.address}: ${error.message}`);
        }
    }

    console.log("Registration completed. Starting actions...");

    for (let i = 0; i < totalUsers * 5; i++) {
        const user = users[Math.floor(Math.random() * totalUsers)];
        const action = actions[Math.floor(Math.random() * actions.length)];
        const energyAmount = Math.floor(Math.random() * 50) + 1; // Енергія для трейдингу/оновлення

        try {
            if (action === "updateBalance") {
                await manager.connect(user).updateEnergyBalance(energyAmount);
                report.balanceUpdates++;
                report.logs.push(
                    `User ${user.address} updated their balance by ${energyAmount} units.`
                );
            } else if (action === "tradeEnergy") {
                const isBuying = Math.random() < 0.5; // 50% шанс покупки/продажу
                await manager.connect(user).requestEnergy(energyAmount, isBuying);

                if (isBuying) {
                    report.successfulTrades++;
                    report.logs.push(
                        `User ${user.address} successfully requested to buy ${energyAmount} units.`
                    );
                } else {
                    report.logs.push(
                        `User ${user.address} successfully requested to sell ${energyAmount} units.`
                    );
                }
            }
        } catch (error: any) {
            if (action === "tradeEnergy") report.failedTrades++;
            report.logs.push(
                `Action failed for user ${user.address} during ${action}: ${error.message}`
            );
        }
    }

    const endBlock = await provider.getBlockNumber();

    let totalGasUsed = 0;
    for (let i = startBlock; i <= endBlock; i++) {
        const block = await provider.getBlock(i);
        totalGasUsed += Number( block.gasUsed);
    }

    report.metadata.blockCount = endBlock - startBlock + 1;
    report.metadata.totalGasUsed = totalGasUsed;

    console.log("\n--- Simulation Report ---");
    console.log(`Total Participants: ${totalUsers}`);
    console.log(`Consumers: ${report.totalConsumers}`);
    console.log(`Prosumers: ${report.totalProsumers}`);
    console.log(`Microgrids: ${microgridCount}`);
    console.log(`Balance Updates: ${report.balanceUpdates}`);
    console.log(`Successful Trades: ${report.successfulTrades}`);
    console.log(`Failed Trades: ${report.failedTrades}`);
    console.log("--- Blockchain Metadata ---");
    console.log(`Total Blocks Processed: ${report.metadata.blockCount}`);
    console.log(`Total Gas Used: ${report.metadata.totalGasUsed}`);
    console.log("--- Logs ---");
    console.log("\nLogs:");
    report.logs.slice(-10).forEach((log) => console.log(log));
}
