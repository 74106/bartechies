(function () {
  var provider;
  var signer;

  function getEl(id) {
    return document.getElementById(id);
  }

  function showConnect() {
    var wrap = getEl('wallet-connect-wrap');
    var connected = getEl('wallet-connected');
    if (wrap) wrap.style.display = 'flex';
    if (connected) connected.style.display = 'none';
    if (!window.ethereum) {
      showWalletHint(true, 'Install <a href="https://metamask.io/download/" target="_blank" rel="noopener">MetaMask</a> to connect');
    } else {
      showWalletHint(false);
    }
  }

  function showConnected(addr) {
    var wrap = getEl('wallet-connect-wrap');
    var connected = getEl('wallet-connected');
    var addrEl = getEl('wallet-address');
    if (wrap) wrap.style.display = 'none';
    if (connected) connected.style.display = 'flex';
    if (addrEl) addrEl.textContent = addr ? (addr.slice(0, 6) + '\u2026' + addr.slice(-4)) : '';
  }

  function setStatus(msg) {
    var statusEl = getEl('web3-status');
    if (statusEl) statusEl.textContent = msg || '';
  }

  function updateSignButton() {
    var signBtn = getEl('sign-neat-btn');
    if (!signBtn) return;
    var scoreEl = getEl('neat-score');
    var score = scoreEl ? scoreEl.textContent : '';
    var hasScore = score && score !== '--' && !isNaN(parseInt(score, 10));
    signBtn.disabled = !signer || !hasScore;
  }

  function connectWallet() {
    if (!window.ethereum) {
      setStatus('Install MetaMask');
      alert('MetaMask not detected. Install the MetaMask browser extension to connect your wallet.');
      return;
    }
    if (typeof ethers === 'undefined') {
      setStatus('Loading…');
      alert('Web3 library still loading. Refresh the page and try again.');
      return;
    }
    var pro = new ethers.providers.Web3Provider(window.ethereum);
    pro.provider.request({ method: 'eth_requestAccounts' })
      .then(function (accounts) {
        if (!accounts.length) {
          setStatus('No account');
          return;
        }
        provider = pro;
        signer = pro.getSigner();
        showConnected(accounts[0]);
        setStatus('');
        updateSignButton();
      })
      .catch(function (err) {
        setStatus('Connect failed');
        console.warn(err);
        alert('Wallet connect failed: ' + (err.message || 'User denied or error'));
      });
  }

  function disconnectWallet() {
    signer = null;
    provider = null;
    showConnect();
    setStatus('');
    var signBtn = getEl('sign-neat-btn');
    if (signBtn) signBtn.disabled = true;
  }

  function signNEATScore() {
    if (!signer) {
      setStatus('Connect wallet first');
      return;
    }
    var scoreEl = getEl('neat-score');
    var score = scoreEl ? scoreEl.textContent : '';
    if (!score || score === '--') {
      setStatus('Calculate NEAT score first');
      return;
    }
    var message = 'Metabolic Reset NEAT Score: ' + score + ' (signed at ' + new Date().toISOString().slice(0, 10) + ')';
    setStatus('Signing…');
    signer.signMessage(message)
      .then(function (sig) {
        setStatus('Signed! ' + sig.slice(0, 10) + '…');
        setTimeout(function () { setStatus(''); }, 5000);
      })
      .catch(function (err) {
        setStatus('Sign failed');
        console.warn(err);
        alert('Sign failed: ' + (err.message || 'User denied or error'));
      });
  }

  function showWalletHint(show, msg) {
    var hint = getEl('wallet-hint');
    if (!hint) return;
    if (show && msg) {
      hint.innerHTML = msg;
      hint.style.display = 'inline';
    } else {
      hint.innerHTML = '';
      hint.style.display = 'none';
    }
  }

  function init() {
    var connectBtn = getEl('connect-wallet-btn');
    var disconnectBtn = getEl('disconnect-wallet-btn');
    if (disconnectBtn) disconnectBtn.addEventListener('click', disconnectWallet);
    var signBtn = getEl('sign-neat-btn');

    if (connectBtn) {
      connectBtn.addEventListener('click', connectWallet);
    }
    if (signBtn) {
      signBtn.addEventListener('click', signNEATScore);
    }

    window.connectWallet = connectWallet;
    window.disconnectWallet = disconnectWallet;
    window.signNEATScore = signNEATScore;

    if (!window.ethereum) {
      showWalletHint(true, 'Install <a href="https://metamask.io/download/" target="_blank" rel="noopener">MetaMask</a> to connect');
    } else if (typeof ethers === 'undefined') {
      showWalletHint(true, 'Loading… refresh if Connect Wallet doesn\'t work');
    }

    if (window.ethereum && typeof ethers !== 'undefined') {
      showWalletHint(false);
      window.ethereum.request({ method: 'eth_accounts' })
        .then(function (accounts) {
          if (accounts.length) {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            showConnected(accounts[0]);
            updateSignButton();
          }
        })
        .catch(function () {});
    }

    var neatScoreEl = getEl('neat-score');
    if (neatScoreEl && typeof MutationObserver !== 'undefined') {
      var obs = new MutationObserver(updateSignButton);
      obs.observe(neatScoreEl, { characterData: true, childList: true, subtree: true });
    }

    setTimeout(updateSignButton, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
