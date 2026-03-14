
(function () {
  if (typeof ethers === 'undefined') {
    console.warn('web3.js: ethers not loaded. Add: <script src="https://cdn.ethers.io/lib/ethers-5.7.2.umd.min.js"></script>');
    return;
  }

  var provider;
  var signer;
  var signBtn = document.getElementById('sign-neat-btn');
  var statusEl = document.getElementById('web3-status');

  function getEl(id) { return document.getElementById(id); }
  function showConnect() {
    var wrap = getEl('wallet-connect-wrap');
    var connected = getEl('wallet-connected');
    if (wrap) wrap.style.display = 'flex';
    if (connected) connected.style.display = 'none';
  }
  function showConnected(addr) {
    var wrap = getEl('wallet-connect-wrap');
    var connected = getEl('wallet-connected');
    var addrEl = getEl('wallet-address');
    if (wrap) wrap.style.display = 'none';
    if (connected) connected.style.display = 'flex';
    if (addrEl) addrEl.textContent = addr ? (addr.slice(0, 6) + '…' + addr.slice(-4)) : '';
  }
  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg || '';
  }

  function updateSignButton() {
    if (!signBtn) return;
    var scoreEl = getEl('neat-score');
    var score = scoreEl ? scoreEl.textContent : '';
    var hasScore = score && score !== '--' && !isNaN(parseInt(score, 10));
    signBtn.disabled = !signer || !hasScore;
  }

  window.connectWallet = function () {
    if (!window.ethereum) {
      setStatus('Install MetaMask');
      return;
    }
    provider = new ethers.providers.Web3Provider(window.ethereum);
    window.ethereum.request({ method: 'eth_requestAccounts' })
      .then(function (accounts) {
        if (!accounts.length) { setStatus('No account'); return; }
        signer = provider.getSigner();
        showConnected(accounts[0]);
        setStatus('');
        updateSignButton();
      })
      .catch(function (err) {
        setStatus('Connect failed');
        console.warn(err);
      });
  };

  window.disconnectWallet = function () {
    signer = null;
    provider = null;
    showConnect();
    setStatus('');
    if (signBtn) signBtn.disabled = true;
  };

  window.signNEATScore = function () {
    if (!signer) return;
    var scoreEl = getEl('neat-score');
    var score = scoreEl ? scoreEl.textContent : '';
    if (!score || score === '--') return;
    var message = 'Metabolic Reset NEAT Score: ' + score + ' (signed at ' + new Date().toISOString().slice(0, 10) + ')';
    setStatus('Signing…');
    signer.signMessage(message)
      .then(function (sig) {
        setStatus('Signed! Tx: ' + sig.slice(0, 10) + '…');
        setTimeout(function () { setStatus(''); }, 5000);
      })
      .catch(function (err) {
        setStatus('Sign failed');
        console.warn(err);
      });
  };

  // Already connected (e.g. page refresh)
  if (window.ethereum) {
    window.ethereum.request({ method: 'eth_accounts' })
      .then(function (accounts) {
        if (accounts.length) {
          provider = new ethers.providers.Web3Provider(window.ethereum);
          signer = provider.getSigner();
          showConnected(accounts[0]);
          updateSignButton();
        }
      });
  }

  // When NEAT score changes, enable/disable sign button
  var neatScoreEl = getEl('neat-score');
  if (neatScoreEl && typeof MutationObserver !== 'undefined') {
    var obs = new MutationObserver(updateSignButton);
    obs.observe(neatScoreEl, { characterData: true, childList: true, subtree: true });
  }

  // Run once on load
  setTimeout(updateSignButton, 500);
})();
