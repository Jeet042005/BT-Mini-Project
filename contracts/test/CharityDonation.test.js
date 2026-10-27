const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("CharityDonation", function () {
  let charity;
  let admin, donor1, donor2, recipient, nonAdmin;
  let oneWeek;

  // Helper to get a future deadline
  const futureDeadline = async (secondsFromNow) => {
    const now = await time.latest();
    return now + secondsFromNow;
  };

  beforeEach(async function () {
    [admin, donor1, donor2, recipient, nonAdmin] = await ethers.getSigners();
    oneWeek = 7 * 24 * 60 * 60;

    const CharityDonation = await ethers.getContractFactory("CharityDonation");
    charity = await CharityDonation.deploy();
    await charity.waitForDeployment();
  });

  // ─────────────────────────────────────────────
  //  DEPLOYMENT
  // ─────────────────────────────────────────────
  describe("Deployment", function () {
    it("should set the deployer as admin", async function () {
      expect(await charity.admin()).to.equal(admin.address);
    });

    it("should start with zero campaigns", async function () {
      expect(await charity.campaignCount()).to.equal(0);
    });
  });

  // ─────────────────────────────────────────────
  //  CAMPAIGN CREATION
  // ─────────────────────────────────────────────
  describe("Campaign Creation", function () {
    it("should allow admin to create a campaign", async function () {
      const deadline = await futureDeadline(oneWeek);
      const goal = ethers.parseEther("5");

      await expect(
        charity.createCampaign(
          "Flood Relief",
          "Help flood victims",
          recipient.address,
          goal,
          deadline
        )
      )
        .to.emit(charity, "CampaignCreated")
        .withArgs(1, "Flood Relief", admin.address, recipient.address, goal, deadline);

      const campaign = await charity.getCampaign(1);
      expect(campaign.title).to.equal("Flood Relief");
      expect(campaign.goal).to.equal(goal);
      expect(campaign.active).to.be.true;
      expect(campaign.amountRaised).to.equal(0);
    });

    it("should reject campaign creation from non-admin", async function () {
      const deadline = await futureDeadline(oneWeek);
      await expect(
        charity
          .connect(nonAdmin)
          .createCampaign("Test", "Test", recipient.address, ethers.parseEther("1"), deadline)
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("should reject a campaign with empty title", async function () {
      const deadline = await futureDeadline(oneWeek);
      await expect(
        charity.createCampaign("", "Description", recipient.address, ethers.parseEther("1"), deadline)
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("should reject a campaign with zero goal", async function () {
      const deadline = await futureDeadline(oneWeek);
      await expect(
        charity.createCampaign("Title", "Desc", recipient.address, 0, deadline)
      ).to.be.revertedWith("Goal must be greater than zero");
    });

    it("should reject a campaign with past deadline", async function () {
      const pastDeadline = (await time.latest()) - 1;
      await expect(
        charity.createCampaign("Title", "Desc", recipient.address, ethers.parseEther("1"), pastDeadline)
      ).to.be.revertedWith("Deadline must be in the future");
    });

    it("should increment campaign count correctly", async function () {
      const deadline = await futureDeadline(oneWeek);
      await charity.createCampaign("C1", "D1", recipient.address, ethers.parseEther("1"), deadline);
      await charity.createCampaign("C2", "D2", recipient.address, ethers.parseEther("2"), deadline);
      expect(await charity.campaignCount()).to.equal(2);
    });
  });

  // ─────────────────────────────────────────────
  //  DONATIONS
  // ─────────────────────────────────────────────
  describe("Donations", function () {
    beforeEach(async function () {
      const deadline = await futureDeadline(oneWeek);
      await charity.createCampaign(
        "Test Campaign",
        "A test campaign",
        recipient.address,
        ethers.parseEther("10"),
        deadline
      );
    });

    it("should accept a valid donation and update campaign total", async function () {
      const amount = ethers.parseEther("1");

      // Send the donation and capture the receipt
      const tx = await charity.connect(donor1).donate(1, { value: amount });
      const receipt = await tx.wait();

      // Verify the DonationReceived event was emitted with correct values
      // (we don't assert exact timestamp to avoid off-by-one second issue)
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "DonationReceived"
      );
      expect(event).to.not.be.undefined;
      expect(event.args[0]).to.equal(1n);               // campaignId
      expect(event.args[1]).to.equal(donor1.address);   // donor
      expect(event.args[2]).to.equal(amount);            // amount

      const campaign = await charity.getCampaign(1);
      expect(campaign.amountRaised).to.equal(amount);
    });

    it("should record the donor information correctly", async function () {
      const amount = ethers.parseEther("2");
      await charity.connect(donor1).donate(1, { value: amount });

      const donations = await charity.getCampaignDonations(1);
      expect(donations.length).to.equal(1);
      expect(donations[0].donor).to.equal(donor1.address);
      expect(donations[0].amount).to.equal(amount);
      expect(donations[0].campaignId).to.equal(1);
    });

    it("should accumulate multiple donations correctly", async function () {
      await charity.connect(donor1).donate(1, { value: ethers.parseEther("1") });
      await charity.connect(donor2).donate(1, { value: ethers.parseEther("3") });

      const campaign = await charity.getCampaign(1);
      expect(campaign.amountRaised).to.equal(ethers.parseEther("4"));

      const donations = await charity.getCampaignDonations(1);
      expect(donations.length).to.equal(2);
    });

    it("should reject a zero-value donation", async function () {
      await expect(charity.connect(donor1).donate(1, { value: 0 })).to.be.revertedWith(
        "Donation amount must be greater than zero"
      );
    });

    it("should reject a donation to an invalid campaign ID", async function () {
      await expect(
        charity.connect(donor1).donate(999, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Invalid campaign ID");
    });

    it("should reject a donation after the deadline", async function () {
      // Move blockchain time past the deadline
      await time.increase(oneWeek + 1);
      await expect(
        charity.connect(donor1).donate(1, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Campaign deadline has passed");
    });

    it("should reject a donation to a closed campaign", async function () {
      await charity.closeCampaign(1);
      await expect(
        charity.connect(donor1).donate(1, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Campaign is not active");
    });

    it("should track total donation count globally", async function () {
      await charity.connect(donor1).donate(1, { value: ethers.parseEther("1") });
      await charity.connect(donor2).donate(1, { value: ethers.parseEther("1") });
      expect(await charity.getTotalDonations()).to.equal(2);
    });
  });

  // ─────────────────────────────────────────────
  //  WITHDRAWALS
  // ─────────────────────────────────────────────
  describe("Fund Withdrawal", function () {
    beforeEach(async function () {
      const deadline = await futureDeadline(oneWeek);
      await charity.createCampaign(
        "Test Campaign",
        "A test campaign",
        recipient.address,
        ethers.parseEther("10"),
        deadline
      );
      // Donor makes a donation
      await charity.connect(donor1).donate(1, { value: ethers.parseEther("3") });
    });

    it("should allow admin to withdraw available funds to recipient", async function () {
      const before = await ethers.provider.getBalance(recipient.address);

      await expect(charity.withdrawFunds(1))
        .to.emit(charity, "FundsWithdrawn")
        .withArgs(1, recipient.address, ethers.parseEther("3"));

      const after = await ethers.provider.getBalance(recipient.address);
      expect(after - before).to.equal(ethers.parseEther("3"));

      const campaign = await charity.getCampaign(1);
      expect(campaign.withdrawnAmount).to.equal(ethers.parseEther("3"));
    });

    it("should reject withdrawal by a non-admin", async function () {
      await expect(charity.connect(nonAdmin).withdrawFunds(1)).to.be.revertedWith(
        "Only admin can perform this action"
      );
    });

    it("should reject withdrawing the same funds twice", async function () {
      await charity.withdrawFunds(1);
      await expect(charity.withdrawFunds(1)).to.be.revertedWith("No funds available for withdrawal");
    });

    it("should correctly track partial and full withdrawals", async function () {
      await charity.withdrawFunds(1);

      // Another donation comes in
      await charity.connect(donor2).donate(1, { value: ethers.parseEther("2") });

      // Now only the new 2 ETH is available
      const available = await charity.getAvailableBalance(1);
      expect(available).to.equal(ethers.parseEther("2"));
    });
  });

  // ─────────────────────────────────────────────
  //  CAMPAIGN UPDATES
  // ─────────────────────────────────────────────
  describe("Campaign Updates", function () {
    beforeEach(async function () {
      const deadline = await futureDeadline(oneWeek);
      await charity.createCampaign(
        "Test",
        "Description",
        recipient.address,
        ethers.parseEther("5"),
        deadline
      );
    });

    it("should allow admin to post an update", async function () {
      await expect(charity.postCampaignUpdate(1, "We purchased 100 food kits!"))
        .to.emit(charity, "CampaignUpdated");

      const updates = await charity.getCampaignUpdates(1);
      expect(updates.length).to.equal(1);
      expect(updates[0].message).to.equal("We purchased 100 food kits!");
    });

    it("should reject updates from non-admin", async function () {
      await expect(
        charity.connect(nonAdmin).postCampaignUpdate(1, "Fake update")
      ).to.be.revertedWith("Only admin can perform this action");
    });
  });

  // ─────────────────────────────────────────────
  //  VIEW FUNCTIONS
  // ─────────────────────────────────────────────
  describe("View Functions", function () {
    it("should return all campaigns via getAllCampaigns", async function () {
      const deadline = await futureDeadline(oneWeek);
      await charity.createCampaign("C1", "D1", recipient.address, ethers.parseEther("1"), deadline);
      await charity.createCampaign("C2", "D2", recipient.address, ethers.parseEther("2"), deadline);

      const all = await charity.getAllCampaigns();
      expect(all.length).to.equal(2);
      expect(all[0].title).to.equal("C1");
      expect(all[1].title).to.equal("C2");
    });

    it("should return correct total raised across all campaigns", async function () {
      const deadline = await futureDeadline(oneWeek);
      await charity.createCampaign("C1", "D1", recipient.address, ethers.parseEther("5"), deadline);
      await charity.createCampaign("C2", "D2", recipient.address, ethers.parseEther("5"), deadline);

      await charity.connect(donor1).donate(1, { value: ethers.parseEther("2") });
      await charity.connect(donor2).donate(2, { value: ethers.parseEther("3") });

      const total = await charity.getTotalRaised();
      expect(total).to.equal(ethers.parseEther("5"));
    });
  });
});
