// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TrustChain {
    struct User {
        string name;
        bool isRegistered;
    }
    
    mapping(address => User) public users;
    
    event UserRegistered(address indexed userWallet, string name);
    event DonationMade(address indexed donor, address indexed receiver, uint256 amount, string donorName, uint256 timestamp);

    function registerUser(string memory _name) public {
        require(!users[msg.sender].isRegistered, "User already registered");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        users[msg.sender] = User(_name, true);
        emit UserRegistered(msg.sender, _name);
    }

    function donate(address payable _receiver) public payable {
        require(msg.value > 0, "Donation must be greater than 0");
        require(users[msg.sender].isRegistered, "Please register first");
        
        // Secure transfer method
        (bool sent, ) = _receiver.call{value: msg.value}("");
        require(sent, "Failed to send Ether");
        
        emit DonationMade(msg.sender, _receiver, msg.value, users[msg.sender].name, block.timestamp);
    }
    
    function getUser(address _user) public view returns (string memory, bool) {
        return (users[_user].name, users[_user].isRegistered);
    }
}