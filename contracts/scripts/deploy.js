const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying CharityDonation contract...");
  console.log("Deployer address:", deployer.address);
  console.log(
    "Deployer balance:",
    hre.ethers.formatEther(
      await hre.ethers.provider.getBalance(deployer.address),
    ),
    "ETH",
  );

  // Deploy the contract
  const CharityDonation = await hre.ethers.getContractFactory(
    "CharityDonation",
  );
  const charity = await CharityDonation.deploy();
  await charity.waitForDeployment();

  const contractAddress = await charity.getAddress();
  console.log("\n✅ CharityDonation deployed to:", contractAddress);

  // ─────────────────────────────────────────────
  //  Seed sample campaigns for demonstration
  // ─────────────────────────────────────────────
  const oneWeek = 7 * 24 * 60 * 60;
  const twoWeeks = 14 * 24 * 60 * 60;
  const oneMonth = 30 * 24 * 60 * 60;

  const nowSeconds = Math.floor(Date.now() / 1000);

  const campaigns = [
    {
      title: "Flood Relief Fund",
      description:
        "This campaign provides emergency relief to families affected by devastating floods. Funds will be used for food, clean water, temporary shelter, and medical supplies. Every donation directly helps displaced families rebuild their lives. This is a demonstration campaign on the local test network.",
      recipient: deployer.address, // Using deployer for demo
      goal: hre.ethers.parseEther("10"),
      deadline: nowSeconds + oneWeek,
    },
    {
      title: "Education for Underprivileged Children",
      description:
        "Help us provide quality education to children from low-income families. Donations will fund school fees, books, uniforms, and digital learning tools. Education is the most powerful tool we can give to the next generation. This is a demonstration campaign on the local test network.",
      recipient: deployer.address,
      goal: hre.ethers.parseEther("5"),
      deadline: nowSeconds + twoWeeks,
    },
    {
      title: "Medical Emergency Assistance",
      description:
        "This fund covers emergency medical expenses for individuals who cannot afford critical healthcare. We work with local hospitals to ensure funds reach patients in genuine need. All disbursements are recorded and reported transparently. This is a demonstration campaign on the local test network.",
      recipient: deployer.address,
      goal: hre.ethers.parseEther("8"),
      deadline: nowSeconds + oneMonth,
    },
    {
      title: "Education Support for Underprivileged Students",

      description:
        "This fund provides educational support to students from financially disadvantaged families. Donations help cover essential school supplies, books, tuition fees, and other learning resources. Our goal is to make education accessible and create better opportunities for students. All donations are recorded transparently on the blockchain. This is a demonstration campaign on the local test network.",

      recipient: deployer.address,

      goal: hre.ethers.parseEther("8"),

      deadline: nowSeconds + oneMonth,
    },
  ];

  console.log("\n📋 Creating sample campaigns...");

  for (const [i, camp] of campaigns.entries()) {
    const tx = await charity.createCampaign(
      camp.title,
      camp.description,
      camp.recipient,
      camp.goal,
      camp.deadline,
    );
    await tx.wait();
    console.log(`  ✅ Campaign ${i + 1} created: "${camp.title}"`);
  }

  // ─────────────────────────────────────────────
  //  Print config for .env
  // ─────────────────────────────────────────────
  console.log("\n─────────────────────────────────────────────");
  console.log("📝 Add the following to client/.env:");
  console.log(`VITE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`VITE_NETWORK_CHAIN_ID=31337`);
  console.log(`VITE_RPC_URL=http://127.0.0.1:8545`);
  console.log("─────────────────────────────────────────────\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
