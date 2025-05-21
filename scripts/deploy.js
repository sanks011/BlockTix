const hre = require("hardhat");

async function main() {
  // Deploy EventTicket contract
  const EventTicket = await hre.ethers.getContractFactory("EventTicket");
  const eventTicket = await EventTicket.deploy();
  await eventTicket.deployed();
  console.log("EventTicket deployed to:", eventTicket.address);

  // Deploy TicketMarketplace contract
  const TicketMarketplace = await hre.ethers.getContractFactory("TicketMarketplace");
  const ticketMarketplace = await TicketMarketplace.deploy(eventTicket.address);
  await ticketMarketplace.deployed();
  console.log("TicketMarketplace deployed to:", ticketMarketplace.address);

  // Deploy Fundraising contract
  const Fundraising = await hre.ethers.getContractFactory("Fundraising");
  const fundraising = await Fundraising.deploy();
  await fundraising.deployed();
  console.log("Fundraising deployed to:", fundraising.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });