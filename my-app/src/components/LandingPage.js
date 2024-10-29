import React, { useState, useEffect, useCallback, useRef } from 'react';
import './LandingPage.css';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { FaSpinner } from 'react-icons/fa';
import AnimatedButton from './AnimatedButton';
import { PieChart } from 'react-minimal-pie-chart';
import { motion, useAnimation } from 'framer-motion';
import { FaArrowUp, FaArrowDown, FaShoppingCart, FaQuestion } from 'react-icons/fa';
import { 
  FaExchangeAlt, FaFileInvoice, FaMoneyCheckAlt, FaPiggyBank, 
  FaUndo, FaMoneyBillWave, FaHandHoldingUsd, FaUniversity, 
  FaCreditCard, FaClock, FaReceipt, FaChartLine, 
  FaPercentage, FaBalanceScale, FaChartBar, FaReply, FaMoneyBillAlt, 
  FaPercent, FaShieldAlt, FaHome
} from 'react-icons/fa';

function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [connection, setConnection] = useState(null);
  const [bankInfo, setBankInfo] = useState(null);
  const [error, setError] = useState(null);
  const [justConnected, setJustConnected] = useState(false);

  const refreshConnectionInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const connectionsData = await fetchConnections();
      console.log('Connections:', connectionsData);
      if (connectionsData.connections && connectionsData.connections.length > 0) {
        setConnection(connectionsData.connections[0]);
        const info = await fetchBankInfo();
        console.log('Bank Info:', info);
        setBankInfo(info);
      } else {
        setConnection(null);
        setBankInfo(null);
      }
    } catch (err) {
      console.error('Error in refreshConnectionInfo:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkUserAndConnection = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const userInfo = await fetchUserInfo();
      console.log('User Info:', userInfo);
      setUser(userInfo);

      if (userInfo && userInfo.connections && userInfo.connections.length > 0) {
        setConnection(userInfo.connections[0]);
        setBankInfo(userInfo);
      } else {
        await refreshConnectionInfo();
      }
    } catch (err) {
      console.error('Error in checkUserAndConnection:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [refreshConnectionInfo]);

  useEffect(() => {
    if (window.location.pathname === '/connection_established') {
      window.history.pushState({}, '', '/');
      setJustConnected(true);
    }
    checkUserAndConnection();
  }, [checkUserAndConnection]);

  useEffect(() => {
    if (justConnected) {
      refreshConnectionInfo();
      setJustConnected(false);
    }
  }, [justConnected, refreshConnectionInfo]);

  const fetchUserInfo = async () => {
    const response = await fetch('/api/get-accounts');
    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }
    const data = await response.json();
    console.log('Fetched User Info:', data);
    return data;
  };

  const fetchConnections = async () => {
    const response = await fetch('/api/list-connections');
    if (!response.ok) {
      throw new Error('Failed to fetch connections');
    }
    const data = await response.json();
    console.log('Fetched Connections:', data);
    return data;
  };

  const fetchBankInfo = async () => {
    try {
      const accountsResponse = await fetch('/api/get-accounts');
      if (!accountsResponse.ok) {
        throw new Error('Failed to fetch accounts');
      }
      const accountsData = await accountsResponse.json();
      
      if (accountsData.status === 'SCA_required') {
        handleSCARequired(accountsData);
        return null;
      }
      
      const transactionsResponse = await fetch('/api/get-transactions');
      if (!transactionsResponse.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const transactionsData = await transactionsResponse.json();
      
      console.log('Fetched Bank Info:', { ...accountsData, ...transactionsData });
      return { ...accountsData, ...transactionsData };
    } catch (error) {
      console.error('Error fetching bank info:', error);
      throw error;
    }
  };

  const handleCreateUser = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/create-user', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed to create user');
      }
      const data = await response.json();
      setUser(data);
      await refreshConnectionInfo();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddConnection = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/add-connection', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed to add connection');
      }
      const data = await response.json();
      if (data.webview_url) {
        window.location.href = data.webview_url;
      } else {
        throw new Error('No webview URL provided');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    confirmAlert({
      customUI: ({ onClose }) => {
        return (
          <div className='custom-ui'>
            <h1>Confirm Account Deletion</h1>
            <p>Are you sure you want to delete your user account? This action cannot be undone.</p>
            <div className="button-container">
              <button
                className='confirm-no'
                onClick={onClose}
              >
                No
              </button>
              <button
                className='confirm-yes'
                onClick={async () => {
                  setIsLoading(true);
                  setError(null);
                  try {
                    const response = await fetch('/api/delete-user', { method: 'DELETE' });
                    if (!response.ok) {
                      throw new Error('Failed to delete user');
                    }
                    setUser(null);
                    setBankInfo(null);
                    setConnection(null);
                  } catch (err) {
                    setError(err.message);
                  } finally {
                    setIsLoading(false);
                  }
                  onClose();
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        );
      }
    });
  };

  const handleSCARequired = (data) => {
    confirmAlert({
      customUI: ({ onClose }) => {
        return (
          <div className='custom-ui'>
            <h2>Strong Authentication Required</h2>
            <p>For security reasons and in compliance with banking regulations, strong authentication is necessary to access your banking data.</p>
            <p>You will be redirected to your bank to confirm your identity.</p>
            <div className="button-container">
              <button
                className='confirm-no'
                onClick={() => {
                  onClose();
                  if (data && data.webview_url) {
                    window.location.href = data.webview_url;
                  } else {
                    console.error('No webview URL provided');
                  }
                }}
              >
                Continue
              </button>
              <button
                className='confirm-yes'
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </div>
        );
      }
    });
  };

  const CashFlowSummary = ({ inflows, outflows, netCashFlow }) => {
    const controls = useAnimation();
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    const total = Math.abs(inflows) + Math.abs(outflows) + Math.abs(netCashFlow);
    const inflowsAngle = (Math.abs(inflows) / total) * 360;
    const outflowsAngle = (Math.abs(outflows) / total) * 360;

    const data = [
      { title: 'Inflows', value: Math.abs(inflows), color: 'url(#ivoryMetallic)' },
      { title: 'Outflows', value: Math.abs(outflows), color: 'url(#matteBlackMetallic)' },
      { title: 'Net Cash Flow', value: Math.abs(netCashFlow), color: netCashFlow >= 0 ? 'url(#shinyGoldMetallic)' : 'url(#redMetallic)' }
    ];

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            controls.start({ rotate: 360 });
          }
        },
        { threshold: 0.1 }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      };
    }, [controls, isVisible]);

    return (
      <div className="cash-flow-summary" ref={ref}>
        <h4>Cash Flow Summary</h4>
        <motion.div 
          className="pie-chart-container"
          initial={{ rotate: 0 }}
          animate={controls}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: 0.8
          }}
        >
          <PieChart
            data={data}
            lineWidth={40}
            paddingAngle={0}
            rounded={false}
            startAngle={-90}
          >
            <defs>
              <linearGradient id="ivoryMetallic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFF0" />
                <stop offset="50%" stopColor="#FFF8DC" />
                <stop offset="100%" stopColor="#FFEBCD" />
              </linearGradient>
              <linearGradient id="matteBlackMetallic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4A4A4A" />
                <stop offset="50%" stopColor="#363636" />
                <stop offset="100%" stopColor="#1C1C1C" />
              </linearGradient>
              <linearGradient id="shinyGoldMetallic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="50%" stopColor="#DAA520" />
                <stop offset="100%" stopColor="#B8860B" />
              </linearGradient>
              <linearGradient id="redMetallic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6B6B" />
                <stop offset="50%" stopColor="#FF0000" />
                <stop offset="100%" stopColor="#8B0000" />
              </linearGradient>
            </defs>
          </PieChart>
        </motion.div>
        <div className="cash-flow-legend">
          {data.map((item, index) => (
            <div key={index} className="legend-item">
              <span className="legend-color" style={{ background: getBaseColor(item.color) }}></span>
              <span className="legend-title">
                {item.title}: {item.title === 'Net Cash Flow' && netCashFlow < 0 ? '-' : ''}
                {item.value.toFixed(2)} €
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Helper function to get base color for legend
  const getBaseColor = (gradientUrl) => {
    switch(gradientUrl) {
      case 'url(#ivoryMetallic)':
        return '#FFF8DC';
      case 'url(#matteBlackMetallic)':
        return '#363636';
      case 'url(#shinyGoldMetallic)':
        return '#DAA520';
      case 'url(#redMetallic)':
        return '#FF0000';
      default:
        return '#FFF8DC';
    }
  };

  const TransactionList = ({ transactions }) => {
    const [sortBy, setSortBy] = useState('date');
    const [filterType, setFilterType] = useState('all');

    const getIcon = (type = '') => {
      switch(type.toLowerCase()) {
        case 'transfer': return <FaExchangeAlt />;
        case 'order': return <FaFileInvoice />;
        case 'check': return <FaMoneyCheckAlt />;
        case 'deposit': return <FaPiggyBank />;
        case 'payback': return <FaUndo />;
        case 'withdrawal': return <FaMoneyBillWave />;
        case 'loan_repayment': return <FaHandHoldingUsd />;
        case 'bank': return <FaUniversity />;
        case 'card': return <FaCreditCard />;
        case 'deferred_card': return <FaClock />;
        case 'summary_card': return <FaReceipt />;
        case 'payment': return <FaShoppingCart />;
        case 'market_order': return <FaChartLine />;
        case 'market_fee': return <FaPercentage />;
        case 'arbitrage': return <FaBalanceScale />;
        case 'profit': return <FaChartBar />;
        case 'refund': return <FaReply />;
        case 'payout': return <FaMoneyBillAlt />;
        case 'fee': return <FaPercent />;
        default: return <FaQuestion />;
      }
    };

    const sortedTransactions = [...transactions].sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'amount') return parseFloat(b.formatted_value) - parseFloat(a.formatted_value);
      return 0;
    });

    const filteredTransactions = sortedTransactions.filter(transaction => {
      if (filterType === 'all') return true;
      if (filterType === 'income') return parseFloat(transaction.formatted_value) > 0;
      if (filterType === 'expense') return parseFloat(transaction.formatted_value) < 0;
      return true;
    });

    return (
      <div className="transaction-list">
        <div className="transaction-controls">
          <select onChange={(e) => setSortBy(e.target.value)} value={sortBy}>
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
          </select>
          <select onChange={(e) => setFilterType(e.target.value)} value={filterType}>
            <option value="all">All Transactions</option>
            <option value="income">Income Only</option>
            <option value="expense">Expenses Only</option>
          </select>
        </div>
        {filteredTransactions.map((transaction, index) => (
          <motion.div 
            key={transaction.id} 
            className="transaction-card"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="transaction-icon">
              {getIcon(transaction.type)}
            </div>
            <div className="transaction-details">
              <h3>{transaction.wording}</h3>
              <p>{new Date(transaction.date).toLocaleDateString()}</p>
            </div>
            <div className={`transaction-amount ${parseFloat(transaction.formatted_value) >= 0 ? 'income' : 'expense'}`}>
              {parseFloat(transaction.formatted_value) >= 0 ? <FaArrowUp /> : <FaArrowDown />}
              {transaction.formatted_value}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const AccountList = ({ accounts }) => {
    const getIcon = (type = '') => {
      switch(type.toLowerCase()) {
        case 'checking': return <FaUniversity />;
        case 'savings': return <FaPiggyBank />;
        case 'card': return <FaCreditCard />;
        case 'loan': return <FaMoneyBillWave />;
        case 'investment': 
        case 'market': return <FaChartLine />;
        case 'real_estate': return <FaHome />;
        case 'life_insurance':
        case 'lifeinsurance': return <FaShieldAlt />;
        case 'pea': return <FaChartBar />;
        case 'article83':
        case 'capitalisation':
        case 'deposit':
        case 'ldds':
        case 'madelin':
        case 'pee':
        case 'per':
        case 'perco':
        case 'perp': return <FaPiggyBank />;
        case 'crowdlending': return <FaHandHoldingUsd />;
        case 'rsp': return <FaPercentage />;
        default: return <FaQuestion />;
      }
    };

    return (
      <div className="account-list">
        <div className="account-cards">
          {accounts.map((account, index) => (
            <motion.div 
              key={account.id} 
              className="account-card"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="account-icon">
                {getIcon(account.type)}
              </div>
              <div className="account-details">
                <h3>{account.name}</h3>
                <p>{account.original_name}</p>
                <p>{account.iban}</p>
              </div>
              <div className="account-balance">
                <span className={`metallic-amount ${parseFloat(account.balance) >= 0 ? 'positive' : 'negative'}`}>
                  {account.formatted_balance}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  console.log('Render state:', { user, connection, bankInfo, isLoading, error });

  return (
    <div className="landing-page">
      <h1 className="app-title">Cash<strong>Harbor</strong></h1>
      {isLoading ? (
        <div className="loading-container">
          <FaSpinner className="loading-spinner" />
          <p>Loading...</p>
        </div>
      ) : !user ? (
        <>
          <div className="marketing-pitch">
            <h2>Your Finances, Your Control</h2>
            <p>Open-source financial aggregator</p>
            
            <div className="info-section">
              <h4>Key Features:</h4>
              <ul>
                <li>Self-hosted solution for maximum privacy</li>
                <li>Bank aggregation powered by Powens</li>
                <li>Clear overview of your financial flows</li>
                <li>Open-source transparency</li>
              </ul>
            </div>

            <p>With CashHarbor, you're in control</p>

            <div className="info-section">
              <h4>Security & Privacy</h4>
              <ul>
                <li>Your data stays on your own server</li>
                <li>Minimal data sharing: only what's necessary for aggregation</li>
                <li>Powered by Powens, a regulated financial service provider</li>
                <li>Full transparency on data usage</li>
              </ul>
            </div>
          </div>
          <button onClick={handleCreateUser} disabled={isLoading}>
            Get Started
          </button>
        </>
      ) : (
        <>
          <h2>Bank Information</h2>
          {bankInfo ? (
            <div className="info-section">
                <h4>All Accounts</h4>
              <AccountList accounts={bankInfo.accounts} />
              
              <div className="info-section">
                <h4>All Transactions</h4>
                <TransactionList transactions={bankInfo.transactions} />
              </div>

              <CashFlowSummary
                inflows={calculateCashFlow(bankInfo.transactions).inflows}
                outflows={calculateCashFlow(bankInfo.transactions).outflows}
                netCashFlow={calculateCashFlow(bankInfo.transactions).netCashFlow}
              />

              <div className="action-buttons">
                <AnimatedButton
                  onClick={handleAddConnection}
                  className="add-connection-btn"
                >
                  Add Account 
                </AnimatedButton>
              </div>
              
              <div className="delete-user-container">
                <AnimatedButton
                  onClick={handleDeleteUser}
                  className="delete-user-btn"
                  danger={true}
                >
                  Delete User
                </AnimatedButton>
              </div>
            </div>
          ) : (
            <>
              <div className="no-bank-info">
                <p>No bank information available yet.</p>
                <div className="info-section">
                  <h4>Your Data Security</h4>
                  <ul>
                    <li>Your data stays on your own server</li>
                    <li>Minimal data sharing: only what's necessary for aggregation</li>
                    <li>Powered by Powens, a regulated financial service provider</li>
                    <li>Full transparency and control over your financial data</li>
                  </ul>
                </div>
              </div>
              <AnimatedButton 
                onClick={handleAddConnection} 
                className="add-connection-btn"
              >
                Add Account
              </AnimatedButton>
            </>
          )}
        </>
      )}
    </div>
  );
}

function calculateCashFlow(transactions) {
  return transactions.reduce((acc, transaction) => {
    const amount = parseFloat(transaction.value);
    if (amount > 0) {
      acc.inflows += amount;
    } else {
      acc.outflows += Math.abs(amount);
    }
    acc.netCashFlow = acc.inflows - acc.outflows;
    return acc;
  }, { inflows: 0, outflows: 0, netCashFlow: 0 });
}

export default LandingPage;