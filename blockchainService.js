(function (global) {
  'use strict';

  if (typeof global.ethers === 'undefined') {
    console.warn('blockchainService: ethers.js not loaded.');
    return;
  }

  var ethers = global.ethers;
  var config = global.BLOCKCHAIN_CONFIG || {};
  var CONTRACT_ADDRESS = config.CONTRACT_ADDRESS || '';
  var CHAIN_ID = config.CHAIN_ID || 80002;
  var RPC_URL = config.RPC_URL || 'https://rpc-amoy.polygon.technology';
  var CHAIN_NAME = config.CHAIN_NAME || 'Polygon Amoy Testnet';

  var ABI = [
    'function addRecord(uint256 neatScore, uint256 deskHours, uint256 standingHours, uint256 steps, uint256 age)',
    'function getRecordCount() view returns (uint256)',
    'function getRecord(uint256 index) view returns (address user, uint256 neatScore, uint256 deskHours, uint256 standingHours, uint256 steps, uint256 age, uint256 timestamp)',
    'event RecordAdded(address indexed user, uint256 indexed recordIndex, uint256 neatScore, uint256 timestamp)',
  ];

  var provider = null;
  var signer = null;
  var contract = null;
  var currentAddress = null;

  function getProvider() {
    if (typeof global.ethereum === 'undefined') {
      return null;
    }
    if (!provider) {
      provider = new ethers.providers.Web3Provider(global.ethereum);
    }
    return provider;
  }

  function getContract() {
    if (!CONTRACT_ADDRESS) return null;
    if (!contract && signer) {
      contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    }
    return contract;
  }

  function connectWallet() {
    var eth = global.ethereum;
    if (!eth) {
      return Promise.reject(new Error('MetaMask not installed. Please install the MetaMask extension.'));
    }
    var prov = getProvider();
    if (!prov) return Promise.reject(new Error('Provider not available.'));

    return prov.send('eth_requestAccounts', []).then(function (accounts) {
      if (!accounts || accounts.length === 0) {
        return null;
      }
      signer = prov.getSigner();
      currentAddress = accounts[0];
      contract = null;
      return ensureChain().then(function () {
        return currentAddress;
      });
    }).catch(function (err) {
      if (err.code === 4001 || err.message && err.message.indexOf('rejected') !== -1) {
        return Promise.reject(new Error('Wallet connection was rejected.'));
      }
      return Promise.reject(err);
    });
  }

  function ensureChain() {
    var eth = global.ethereum;
    if (!eth) return Promise.resolve();

    return eth.request({ method: 'eth_chainId' }).then(function (hexChainId) {
      var chainId = parseInt(hexChainId, 16);
      if (chainId === CHAIN_ID) return;

      return eth.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x' + CHAIN_ID.toString(16),
            chainName: CHAIN_NAME,
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: [RPC_URL],
            blockExplorerUrls: [CHAIN_ID === 80002 ? 'https://amoy.polygonscan.com' : 'https://sepolia.etherscan.io'],
          },
        ],
      }).then(function () {
        return eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x' + CHAIN_ID.toString(16) }] });
      });
    }).catch(function (err) {
      if (err.code === 4001) {
        return Promise.reject(new Error('Please switch to ' + CHAIN_NAME + ' in MetaMask to use this app.'));
      }
      if (err.code === 4902) {
        return Promise.reject(new Error('Please add ' + CHAIN_NAME + ' in MetaMask and try again.'));
      }
      return Promise.reject(err);
    });
  }

  function disconnectWallet() {
    signer = null;
    contract = null;
    currentAddress = null;
  }

  function getAddress() {
    return currentAddress;
  }

  function isConnected() {
    return !!currentAddress;
  }

  function addRecord(record) {
    if (!CONTRACT_ADDRESS) {
      return Promise.reject(new Error('Contract not configured. Set CONTRACT_ADDRESS in js/blockchainConfig.js'));
    }
    if (!signer) {
      return Promise.reject(new Error('Wallet not connected. Connect MetaMask first.'));
    }
    var c = getContract();
    if (!c) return Promise.reject(new Error('Contract not available.'));

    var neatScore = Math.min(100, Math.max(0, Math.round(Number(record.neatScore) || 0)));
    var deskHours = Math.max(0, Math.round(Number(record.deskHours) || 0));
    var standingHours = Math.max(0, Math.round(Number(record.standingHours) || 0));
    var steps = Math.max(0, Math.round(Number(record.steps) || 0));
    var age = Math.max(0, Math.min(255, Math.round(Number(record.age) || 0)));

    return ensureChain().then(function () {
      return c.addRecord(neatScore, deskHours, standingHours, steps, age);
    }).then(function (tx) {
      return tx.wait().then(function (receipt) {
        return { hash: receipt.transactionHash, success: true };
      });
    }).catch(function (err) {
      if (err.code === 4001) {
        return Promise.reject(new Error('Transaction was rejected.'));
      }
      if (err.code === 'NETWORK_ERROR' || err.message && (err.message.indexOf('network') !== -1 || err.message.indexOf('chain') !== -1)) {
        return Promise.reject(new Error('Wrong network. Please switch to ' + CHAIN_NAME + ' in MetaMask.'));
      }
      return Promise.reject(err);
    });
  }

  function saveRecord(record) {
    return addRecord(record);
  }

  function getRecordCount() {
    if (!CONTRACT_ADDRESS) return Promise.resolve(0);
    var prov = getProvider();
    if (!prov) return Promise.resolve(0);
    var c = new ethers.Contract(CONTRACT_ADDRESS, ABI, prov);
    return c.getRecordCount().then(function (n) {
      return n.toNumber ? n.toNumber() : Number(n);
    }).catch(function () {
      return 0;
    });
  }

  function restoreConnection() {
    var eth = global.ethereum;
    if (!eth || !getProvider()) return Promise.resolve(null);
    return eth.request({ method: 'eth_accounts' }).then(function (accounts) {
      if (!accounts || accounts.length === 0) return null;
      signer = getProvider().getSigner();
      currentAddress = accounts[0];
      contract = null;
      return currentAddress;
    }).catch(function () {
      return null;
    });
  }

  if (typeof global.ethereum !== 'undefined') {
    global.ethereum.on('accountsChanged', function (accounts) {
      if (!accounts || accounts.length === 0) {
        disconnectWallet();
      } else {
        currentAddress = accounts[0];
        signer = getProvider() ? getProvider().getSigner() : null;
        contract = null;
      }
    });
    global.ethereum.on('chainChanged', function () {
      disconnectWallet();
      if (global.location) global.location.reload();
    });
  }

  global.BlockchainService = {
    connectWallet: connectWallet,
    disconnectWallet: disconnectWallet,
    restoreConnection: restoreConnection,
    getAddress: getAddress,
    isConnected: isConnected,
    addRecord: addRecord,
    saveRecord: saveRecord,
    getRecordCount: getRecordCount,
    ensureChain: ensureChain,
    getContractAddress: function () {
      return CONTRACT_ADDRESS;
    },
    getChainId: function () {
      return CHAIN_ID;
    },
  };
})(typeof window !== 'undefined' ? window : this);
