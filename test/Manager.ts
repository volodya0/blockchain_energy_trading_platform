import { expect } from "chai";
import { ethers } from "hardhat";

describe("Manager Contract", function () {
  let manager: any;
  let p2p: any;
  let m2m: any;
  let owner: any, participant1: any, participant2: any;

  beforeEach(async () => {
    [owner, participant1, participant2] = await ethers.getSigners();

    const P2P = await ethers.getContractFactory("P2P");
    p2p = await P2P.deploy();

    const M2M = await ethers.getContractFactory("M2M");
    m2m = await M2M.deploy();

    const Manager = await ethers.getContractFactory("Manager");
    manager = await Manager.deploy(await p2p.getAddress(), await m2m.getAddress());
  });

  it("should register a participant with correct microgrid ID", async function () {
    const microgridId = 1;
    const initialEnergyBalance = 100;

    await manager.connect(participant1).registerParticipant(true, microgridId, initialEnergyBalance);

    const participant = await p2p.participants(participant1.address);
    expect(participant.isRegistered).to.equal(true);
    expect(participant.microgridId).to.equal(microgridId);

    const microgrid = await m2m.microgrids(microgridId);
    expect(microgrid.isRegistered).to.equal(true);
    expect(microgrid.energyBalance).to.equal(initialEnergyBalance);
  });
});
