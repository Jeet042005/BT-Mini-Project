const { ethers } = require("hardhat");

async function main() {
  const recipient = process.env.RECIPIENT_ADDRESS;

  if (!recipient) {
    throw new Error(
      "Set RECIPIENT_ADDRESS to the MetaMask wallet address you want to fund."
    );
  }

  if (!ethers.isAddress(recipient)) {
    throw new Error("RECIPIENT_ADDRESS must be a valid Ethereum address.");
  }

  const recipientAddress = ethers.getAddress(recipient);
  const [funder] = await ethers.getSigners();
  const tx = await funder.sendTransaction({
    to: recipientAddress,
    value: ethers.parseEther("100"),
  });

  await tx.wait();

  console.log(`Transferred 100 test ETH to ${recipientAddress}.`);
  console.log(
    "Recipient balance:",
    ethers.formatEther(await ethers.provider.getBalance(recipientAddress)),
    "ETH"
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
