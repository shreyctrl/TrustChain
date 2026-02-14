// src/utils/contractConfig.js

// ⚠️ REPLACE THIS WITH YOUR DEPLOYED CONTRACT ADDRESS FROM REMIX
export const CONTRACT_ADDRESS = "0x89C65b5d710F00B022C6b10524649127F1C763b3"; 

export const CONTRACT_ABI = [
  "function registerUser(string _name) public",
  "function donate(address payable _receiver) public payable",
  "function getUser(address _user) public view returns (string, bool)",
  "event DonationMade(address indexed donor, address indexed receiver, uint256 amount, string donorName, uint256 timestamp)",
  "event UserRegistered(address indexed userWallet, string name)"
];