import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './utils/contractConfig';
import './App.css';

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [userName, setUserName] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        const tempContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        setAccount(address);
        setContract(tempContract);
        
        try {
          const userData = await tempContract.getUser(address);
          if (userData[1]) {
            setUserName(userData[0]);
            setIsRegistered(true);
          } else {
            setIsRegistered(false);
          }
        } catch (err) { console.error(err); }
      } catch (error) { alert("Connection failed: " + error.message); }
    } else { alert("Please install MetaMask!"); }
  };

  return (
    <Router>
      <div className="app-wrapper">
        <NavBar account={account} userName={userName} connectWallet={connectWallet} />
        <Routes>
          <Route path="/" element={<LandingPage account={account} />} />
          <Route path="/profile" element={
            <ProfilePage 
              account={account} 
              contract={contract} 
              isRegistered={isRegistered} 
              setIsRegistered={setIsRegistered}
              setUserName={setUserName}
              userName={userName}
            />
          } />
          <Route path="/donate" element={<DonatePage account={account} contract={contract} />} />
          <Route path="/donations" element={<DonationsPage contract={contract} />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </div>
    </Router>
  );
}

// --- COMPONENTS ---

const NavBar = ({ account, userName, connectWallet }) => {
  const navigate = useNavigate();
  return (
    <nav>
      <div className="nav-left">
        <Link to="/">HOME</Link>
        <Link to="/about">ABOUT</Link>
        <Link to="/donations">EXPLORER</Link>
      </div>
      <div className="nav-right">
        <button className="wallet-btn" onClick={account ? () => navigate('/profile') : connectWallet}>
          {account ? (
            <div className="user-info">
              <span className="user-name">{userName || "Register Now"}</span>
              <span className="user-key">{account.substring(0, 6)}...{account.substring(38)}</span>
            </div>
          ) : "Connect Wallet"}
        </button>
      </div>
    </nav>
  );
};

const LandingPage = ({ account }) => {
  const navigate = useNavigate();
  return (
    <div className="landing-section">
      <div className="hero-content">
        <h1 className="title-bold">TRUST<span className="highlight-orange">CHAIN</span></h1>
        <h3 className="subtitle">Transparency in Every Byte.</h3>
        <button className="landing-donate-btn" onClick={() => account ? navigate('/donate') : alert("Please Connect Wallet first!")}>
          Donate Now ➜
        </button>
      </div>
    </div>
  );
};

const ProfilePage = ({ account, contract, isRegistered, setIsRegistered, setUserName, userName }) => {
  const [tempName, setTempName] = useState("");
  const [donated, setDonated] = useState("0");
  const [received, setReceived] = useState("0");
  const [myTx, setMyTx] = useState([]);
  const [balance, setBalance] = useState("0.00"); // NEW: State for balance
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contract && account) {
      if (isRegistered) loadUserData();
      fetchBalance(); // NEW: Fetch balance
    }
  }, [contract, account, isRegistered]);

  // NEW: Helper to fetch balance
  const fetchBalance = async () => {
    if (window.ethereum && account) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const bal = await provider.getBalance(account);
      setBalance(parseFloat(ethers.utils.formatEther(bal)).toFixed(4));
    }
  };

  const loadUserData = async () => {
    try {
      const filter = contract.filters.DonationMade();
      const logs = await contract.queryFilter(filter);
      let totalDonated = ethers.BigNumber.from(0);
      let totalReceived = ethers.BigNumber.from(0);
      let myTransactions = [];

      logs.forEach(log => {
        const { donor, receiver, amount, donorName } = log.args;
        if (donor.toLowerCase() === account.toLowerCase()) {
          totalDonated = totalDonated.add(amount);
          myTransactions.push({ type: "SENT", other: receiver, amount, name: "To: " + receiver.substring(0,6) });
        }
        if (receiver.toLowerCase() === account.toLowerCase()) {
          totalReceived = totalReceived.add(amount);
          myTransactions.push({ type: "RECEIVED", other: donor, amount, name: "From: " + donorName });
        }
      });

      setDonated(ethers.utils.formatEther(totalDonated));
      setReceived(ethers.utils.formatEther(totalReceived));
      setMyTx(myTransactions.reverse());
    } catch (error) { console.error(error); }
  };

  const registerUser = async () => {
    if (!tempName) return alert("Enter a name!");
    setLoading(true);
    try {
      const tx = await contract.registerUser(tempName);
      await tx.wait();
      setUserName(tempName);
      setIsRegistered(true);
    } catch (err) { alert("Registration Failed: " + (err.reason || err.message)); }
    setLoading(false);
  };

  if (!account) return <div className="center-msg">Please Connect Wallet First.</div>;

  if (!isRegistered) {
    return (
      <div className="profile-container fade-in">
        <h2>Create Identity</h2>
        <p className="sub-text">Link your wallet to a permanent name.</p>
        <input type="text" placeholder="Your Name" className="input-field" onChange={(e) => setTempName(e.target.value)} />
        <button className="action-btn" onClick={registerUser} disabled={loading}>
          {loading ? "Registering..." : "Create Profile"}
        </button>
      </div>
    );
  }

  return (
    <div className="profile-container fade-in">
      <div className="profile-header">
        <div className="profile-left">
          <div className="profile-avatar">👤</div>
          <div>
            <h2>{userName}</h2>
            <span className="public-key">{account}</span>
            {/* NEW: Balance Display */}
            <div className="wallet-balance-tag">Balance: {balance} ETH</div>
          </div>
        </div>
        <div className="profile-right">
          <div className="stat-card">
            <h3>Donated</h3>
            <div className="amount text-orange">{donated} <small>ETH</small></div>
          </div>
          <div className="stat-card">
            <h3>Received</h3>
            <div className="amount text-green">{received} <small>ETH</small></div>
          </div>
        </div>
      </div>
      <div className="transactions-section">
        <h3>Recent Activity</h3>
        <div className="tx-list-scroll">
          {myTx.length === 0 ? <p className="no-data">No transactions found.</p> : myTx.map((tx, i) => (
            <div key={i} className="tx-item">
              <span className={`badge ${tx.type === 'SENT' ? 'badge-orange' : 'badge-green'}`}>{tx.type}</span>
              <span className="tx-name">{tx.name}</span>
              <span className="tx-val">{ethers.utils.formatEther(tx.amount)} ETH</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DonatePage = ({ account, contract }) => {
  const [amount, setAmount] = useState("");
  const [receiver, setReceiver] = useState("");
  const [balance, setBalance] = useState("...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (account && window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const bal = await provider.getBalance(account);
        setBalance(parseFloat(ethers.utils.formatEther(bal)).toFixed(4));
      }
    };
    fetchBalance();
  }, [account]);

  const handleDonate = async () => {
    if (!contract) return alert("Connect Wallet first!");
    setLoading(true);
    try {
      const tx = await contract.donate(receiver, { value: ethers.utils.parseEther(amount) });
      await tx.wait();
      alert("Donation Successful!");
      setAmount(""); setReceiver(""); // Clear inputs
      // Refresh balance logic here if needed
    } catch (err) { alert("Error: " + (err.reason || err.message)); }
    setLoading(false);
  };

  return (
    <div className="donate-container fade-in">
      <div className="donate-box">
        <div className="balance-header">
          <span>Wallet Balance</span>
          <h2>{balance} ETH</h2>
        </div>
        
        <div className="input-group">
          <label>Amount to Donate</label>
          <input type="number" placeholder="0.00" className="input-field" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        
        <div className="input-group">
          <label>Receiver Address</label>
          <input type="text" placeholder="0x..." className="input-field" value={receiver} onChange={(e) => setReceiver(e.target.value)} />
        </div>
        
        <button className="action-btn" onClick={handleDonate} disabled={loading}>
          {loading ? "Processing..." : "Confirm Donation"}
        </button>
      </div>
    </div>
  );
};

const DonationsPage = ({ contract }) => {
  const [events, setEvents] = useState([]);
  
  useEffect(() => {
    if (!contract) return;
    const fetchEvents = async () => {
      const filter = contract.filters.DonationMade();
      const logs = await contract.queryFilter(filter);
      setEvents(logs.map(log => ({
        donor: log.args.donor,
        receiver: log.args.receiver,
        amount: ethers.utils.formatEther(log.args.amount),
        name: log.args.donorName,
        hash: log.transactionHash
      })).reverse());
    };
    fetchEvents();
  }, [contract]);

  return (
    <div className="explorer-container fade-in">
      <h2 className="section-title">Global Donations</h2>
      <div className="explorer-list">
        {events.map((ev, i) => (
          <div key={i} className="explorer-item">
            <div className="explorer-left">
              <span className="explorer-name">{ev.name}</span>
              <span className="explorer-sub">To: {ev.receiver.substring(0,8)}...</span>
            </div>
            <div className="explorer-right">
              <span className="explorer-amount">+{ev.amount} ETH</span>
              <a href={`https://sepolia.etherscan.io/tx/${ev.hash}`} target="_blank" rel="noreferrer" className="view-link">View ↗</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AboutPage = () => (
  <div className="about-container fade-in">
    <h1>About TrustChain</h1>
    <p>Empowering transparency in charity through Blockchain technology.</p>
  </div>
);

export default App;