import { expect } from "chai";
import { ethers } from "hardhat";

describe("P2P Contract", function () {
  let p2p: any;
  let owner: any, participant1: any, participant2: any;

  beforeEach(async () => {
    [owner, participant1, participant2] = await ethers.getSigners();

    const P2P = await ethers.getContractFactory("P2P");
    p2p = await P2P.deploy();
  });

  it("should register a participant as a prosumer", async function () {
    const microgridId = 1;
    const initialEnergyBalance = 100n;

    await p2p.registerParticipant(participant1.address, true, microgridId, initialEnergyBalance);

    const participant = await p2p.participants(participant1.address);
    expect(participant.isRegistered).to.equal(true);
    expect(participant.isProsumer).to.equal(true);
    expect(participant.microgridId).to.equal(microgridId);
    expect(participant.energyBalance).to.equal(initialEnergyBalance);
  });

  it("should register a participant as a consumer", async function () {
    const microgridId = 1;

    await p2p.registerParticipant(participant2.address, false, microgridId, 0);

    const participant = await p2p.participants(participant2.address);
    expect(participant.isRegistered).to.equal(true);
    expect(participant.isProsumer).to.equal(false);
    expect(participant.microgridId).to.equal(microgridId);
    expect(participant.energyBalance).to.equal(0);
  });

  it("should not allow the same participant to be registered twice", async function () {
    const microgridId = 1;
    const initialEnergyBalance = 100;

    await p2p.registerParticipant(participant1.address, true, microgridId, initialEnergyBalance);

    await expect(
      p2p.registerParticipant(participant1.address, true, microgridId, initialEnergyBalance)
    ).to.be.revertedWith("Participant already registered");
  });

  it("should find a prosumer to fulfill the consumer's energy request", async function () {
    const microgridId = 1;
    const initialEnergyBalance = 100;

    await p2p.registerParticipant(participant1.address, true, microgridId, initialEnergyBalance);
    await p2p.registerParticipant(participant2.address, false, microgridId, 0);


    await p2p.tryTradeEnergy(participant2.address, microgridId, 50);

    const prosumer = await p2p.participants(participant1.address);
    const consumer = await p2p.participants(participant2.address);

    expect(prosumer.energyBalance).to.equal(50);
    expect(consumer.energyBalance).to.equal(50);
  });
});
