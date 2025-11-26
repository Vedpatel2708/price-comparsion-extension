// Popup script for managing extension settings

document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    
    document.getElementById('saveApiKey').addEventListener('click', saveApiKey);
    document.getElementById('enableExtension').addEventListener('change', handleEnableToggle);
    document.getElementById('enableScamDetection').addEventListener('change', handleScamToggle);
  });
  
  function loadSettings() {
    chrome.storage.sync.get(['groqApiKey', 'extensionEnabled', 'scamDetectionEnabled'], function(result) {
      if (result.groqApiKey && result.groqApiKey !== 'YOUR_GROQ_API_KEY_HERE') {
        document.getElementById('apiKey').value = result.groqApiKey;
      }
      document.getElementById('enableExtension').checked = result.extensionEnabled !== false;
      document.getElementById('enableScamDetection').checked = result.scamDetectionEnabled !== false;
      updateStatus();
    });
  }
  
  function saveApiKey() {
    const apiKey = document.getElementById('apiKey').value.trim();
    
    if (!apiKey) {
      alert('Please enter a valid API key');
      return;
    }
    
    chrome.runtime.sendMessage({
      action: 'saveApiKey',
      apiKey: apiKey
    }, function(response) {
      if (response && response.success) {
        const successMsg = document.getElementById('successMessage');
        successMsg.classList.add('show');
        setTimeout(() => {
          successMsg.classList.remove('show');
        }, 3000);
        updateStatus();
      }
    });
  }
  
  function handleEnableToggle(e) {
    const enabled = e.target.checked;
    chrome.storage.sync.set({ extensionEnabled: enabled }, function() {
      updateStatus();
      notifyContentScripts({ action: 'toggleExtension', enabled });
    });
  }
  
  function handleScamToggle(e) {
    const enabled = e.target.checked;
    chrome.storage.sync.set({ scamDetectionEnabled: enabled }, function() {
      updateStatus();
      notifyContentScripts({ action: 'toggleScamDetection', enabled });
    });
  }
  
  function updateStatus() {
    const statusEl = document.getElementById('status');
    const extensionEnabled = document.getElementById('enableExtension').checked;
    const scamEnabled = document.getElementById('enableScamDetection').checked;
    const apiKey = document.getElementById('apiKey').value.trim();
    
    statusEl.classList.remove('warning', 'error');
    
    if (extensionEnabled) {
      if (scamEnabled) {
        if (apiKey) {
          statusEl.innerHTML = '✓ Extension active with AI scam detection';
          statusEl.classList.remove('warning', 'error');
        } else {
          statusEl.innerHTML = '⚠ Extension active (using basic scam detection)';
          statusEl.classList.add('warning');
        }
      } else {
        statusEl.innerHTML = '✓ Extension active (scam detection off)';
        statusEl.classList.add('warning');
      }
    } else {
      statusEl.innerHTML = '○ Extension is disabled';
      statusEl.classList.add('error');
    }
  }
  
  function notifyContentScripts(message) {
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(tab => {
        if (tab.url && (
          tab.url.includes('amazon.in') ||
          tab.url.includes('flipkart.com') ||
          tab.url.includes('myntra.com')
        )) {
          chrome.tabs.sendMessage(tab.id, message).catch(() => {});
        }
      });
    });
  }