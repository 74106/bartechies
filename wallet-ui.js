(function () {
  'use strict';

  function getEl(id) {
    return document.getElementById(id);
  }

  function truncateAddress(addr) {
    if (!addr || addr.length < 10) return addr;
    return addr.slice(0, 6) + '…' + addr.slice(-4);
  }

  function updateWalletUI() {
    var svc = window.BlockchainService;
    var connectBtn = getEl('connect-wallet-btn');
    var connectedWrap = getEl('wallet-connected');
    var addressEl = getEl('wallet-address');
    var saveBtn = getEl('save-to-blockchain-btn');

    if (!connectBtn || !connectedWrap) return;

    if (svc && svc.isConnected()) {
      var addr = svc.getAddress();
      connectBtn.style.display = 'none';
      connectedWrap.style.display = 'flex';
      if (addressEl) addressEl.textContent = truncateAddress(addr);
      if (saveBtn) saveBtn.disabled = !svc.getContractAddress();
    } else {
      connectBtn.style.display = 'inline-block';
      connectedWrap.style.display = 'none';
      if (addressEl) addressEl.textContent = '';
      if (saveBtn) saveBtn.disabled = true;
    }
  }

  function setBlockchainStatus(text, isError) {
    var el = getEl('blockchain-status');
    if (!el) return;
    el.textContent = text || '';
    el.style.color = isError ? '#f87171' : 'var(--text-secondary)';
  }

  function onConnectClick() {
    var svc = window.BlockchainService;
    if (!svc) {
      setBlockchainStatus('Web3 not loaded.', true);
      return;
    }
    setBlockchainStatus('Connecting…');
    svc.connectWallet()
      .then(function (addr) {
        if (addr) {
          setBlockchainStatus('');
          updateWalletUI();
        } else {
          setBlockchainStatus('No account selected.');
        }
      })
      .catch(function (err) {
        setBlockchainStatus(err.message || 'Connection failed.', true);
      });
  }

  function onDisconnectClick() {
    var svc = window.BlockchainService;
    if (svc) svc.disconnectWallet();
    setBlockchainStatus('');
    updateWalletUI();
  }

  function onSaveToBlockchainClick() {
    var svc = window.BlockchainService;
    if (!svc || !svc.isConnected()) {
      setBlockchainStatus('Connect your wallet first.', true);
      return;
    }
    var deskHours = parseFloat(document.getElementById('desk-hours').value) || 0;
    var standingHours = parseFloat(document.getElementById('standing-hours').value) || 0;
    var steps = parseFloat(document.getElementById('steps').value) || 0;
    var age = parseFloat(document.getElementById('age').value) || 30;
    var neatScoreEl = document.getElementById('neat-score');
    var neatScore = parseInt(neatScoreEl.textContent, 10);
    if (neatScoreEl.textContent === '--' || isNaN(neatScore)) {
      neatScore = 0;
    }
    var saveBtn = getEl('save-to-blockchain-btn');
    if (saveBtn) saveBtn.disabled = true;
    setBlockchainStatus('Sending transaction…');
    var record = {
      neatScore: neatScore,
      deskHours: deskHours,
      standingHours: standingHours,
      steps: steps,
      age: age,
    };
    (svc.saveRecord ? svc.saveRecord(record) : svc.addRecord(record))
      .then(function (result) {
        setBlockchainStatus('Saved to blockchain. Tx: ' + (result.hash ? result.hash.slice(0, 10) + '…' : ''));
        if (saveBtn) saveBtn.disabled = false;
      })
      .catch(function (err) {
        var msg = err && err.message ? err.message : 'Transaction failed.';
        if (err && err.code === 4001) msg = 'Transaction rejected.';
        setBlockchainStatus(msg, true);
        if (saveBtn) saveBtn.disabled = false;
      });
  }

  function init() {
    var connectBtn = getEl('connect-wallet-btn');
    var disconnectBtn = getEl('disconnect-wallet-btn');
    var saveBtn = getEl('save-to-blockchain-btn');

    if (connectBtn) connectBtn.addEventListener('click', onConnectClick);
    if (disconnectBtn) disconnectBtn.addEventListener('click', onDisconnectClick);
    if (saveBtn) saveBtn.addEventListener('click', onSaveToBlockchainClick);

    var svc = window.BlockchainService;
    if (svc && svc.restoreConnection) {
      svc.restoreConnection().then(function () {
        updateWalletUI();
      });
    } else {
      updateWalletUI();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
