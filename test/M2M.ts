import { expect } from "chai";
import { ethers } from "hardhat";

describe("M2M Contract", function () {
  let m2m: any;
  let owner: any;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    const M2M = await ethers.getContractFactory("M2M");
    m2m = await M2M.deploy();
  });

  it("should register a microgrid", async function () {
    const microgridId = 1;
    const initialEnergyBalance = 500;

    await m2m.registerMicrogrid(microgridId, initialEnergyBalance);

    const microgrid = await m2m.microgrids(microgridId);
    expect(microgrid.isRegistered).to.equal(true);
    expect(microgrid.energyBalance).to.equal(initialEnergyBalance);
  });

  it("should update the energy balance of a microgrid", async function () {
    const microgridId = 1;
    const initialEnergyBalance = 500;
    const energyChange = 100;

    await m2m.registerMicrogrid(microgridId, initialEnergyBalance);

    await m2m.updateEnergyBalance(microgridId, energyChange);

    const microgrid = await m2m.microgrids(microgridId);
    expect(microgrid.energyBalance).to.equal(initialEnergyBalance + energyChange);
  });

  it("should find a microgrid with surplus energy", async function () {
    const microgridId1 = 1;
    const microgridId2 = 2;
    const initialEnergyBalance = 500;

    await m2m.registerMicrogrid(microgridId1, initialEnergyBalance);
    await m2m.registerMicrogrid(microgridId2, initialEnergyBalance);

    const foundMicrogridId = await m2m.findGrid(100);
  });
});
