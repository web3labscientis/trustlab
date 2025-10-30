/* ======================================================
   TrustaLab — Wallet Connection (Final Version)
   Using Hedera HashConnect SDK (Testnet Ready)
   ====================================================== */

class WalletManager {
  constructor() {
    this.hashconnect = null;
    this.appMetadata = {
      name: "TrustaLab",
      description: "Decentralized health data verification & payments",
      icon: window.location.origin + "/trustalab_logo.png",
    };
    this.accountId = null;
    this.topic = null;
    this.paired = false;
  }

  // Initialize HashConnect
  async init() {
    try {
      if (!window.HashConnect) {
        this.showError("HashConnect library not loaded. Please check CDN link.");
        console.error("❌ HashConnect SDK missing from HTML.");
        return false;
      }

      // Create a new HashConnect instance
      this.hashconnect = new window.HashConnect();

      // Initialize app metadata
      const initData = await this.hashconnect.init(this.appMetadata, "testnet", false);

      this.topic = initData.topic;
      console.log("✅ HashConnect Initialized:", initData);

      // Listen for connection events
      this.hashconnect.foundExtensionEvent.once((walletMeta) => {
        console.log("🔍 HashPack wallet detected:", walletMeta);
      });

      this.hashconnect.pairingEvent.once((pairingData) => {
        console.log("✅ Paired with HashPack:", pairingData);
        if (pairingData.accountIds && pairingData.accountIds.length > 0) {
          this.accountId = pairingData.accountIds[0];
          this.paired = true;
          this.updateUI();
          this.showSuccess(`Connected: ${this.accountId}`);
        }
      });

      return true;
    } catch (err) {
      console.error("❌ Init Error:", err);
      this.showError("Failed to initialize HashConnect SDK.");
      return false;
    }
  }

  // Connect Wallet
  async connectWallet() {
    const ready = await this.init();
    if (!ready) return;

    try {
      console.log("🔗 Attempting wallet connection...");

      // Connect to local HashPack browser extension
      this.hashconnect.connectToLocalWallet();

      // Wait for user to approve pairing
      this.showInfo("Check HashPack wallet to approve connection.");

    } catch (err) {
      console.error("❌ Wallet connection failed:", err);
      this.showError("Failed to connect HashPack. Please open your wallet extension.");
    }
  }

  // Disconnect Wallet
  disconnectWallet() {
    this.paired = false;
    this.accountId = null;
    this.updateUI();
    this.showInfo("Wallet disconnected.");
  }

  // Update UI dynamically
  updateUI() {
    const btn = document.getElementById("connectWallet");
    if (!btn) return;

    if (this.paired && this.accountId) {
      btn.textContent = `${this.accountId.slice(0, 8)}...`;
      btn.classList.add("bg-green-500", "hover:bg-green-600");
      btn.onclick = () => this.disconnectWallet();
    } else {
      btn.textContent = "Connect Wallet";
      btn.classList.remove("bg-green-500", "hover:bg-green-600");
      btn.onclick = () => this.connectWallet();
    }
  }

  // Toast notification system
  showNotification(message, type = "info") {
    const div = document.createElement("div");
    div.className = `fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 text-white ${
      type === "error"
        ? "bg-red-500"
        : type === "success"
        ? "bg-green-500"
        : "bg-blue-500"
    }`;
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
  }

  showError(msg) {
    this.showNotification(msg, "error");
  }
  showSuccess(msg) {
    this.showNotification(msg, "success");
  }
  showInfo(msg) {
    this.showNotification(msg, "info");
  }
}

// ✅ Initialize wallet when page loads
window.addEventListener("DOMContentLoaded", () => {
  window.walletManager = new WalletManager();
  const connectBtn = document.getElementById("connectWallet");
  if (connectBtn) connectBtn.onclick = () => walletManager.connectWallet();

  console.log("🟢 Wallet manager initialized");
});
    async connectWallet() {
        try {
            if (!this.hashconnect) {
                const initialized = await this.init();
                if (!initialized) {
                    throw new Error('Failed to initialize HashConnect');
                }
            }

            // Request pairing
            const appMetadata = {
                name: 'TrustaLab',
                description: 'Decentralized health data verification platform',
                icon: window.location.origin + '/images/trustalab_logo.png'
            };

            await this.hashconnect.connectToLocalWallet(appMetadata);

        } catch (error) {
            console.error('Failed to connect wallet:', error);
            this.showError('Failed to connect to HashPack wallet. Please make sure HashPack is installed and try again.');
        }
    }

    onWalletConnected(pairingData) {
        this.isConnected = true;
        this.accountId = pairingData.accountIds[0];
        this.updateUI();
        this.showSuccess('Wallet connected successfully!');
    }

    disconnectWallet() {
        this.isConnected = false;
        this.accountId = null;
        if (this.hashconnect) {
            this.hashconnect.disconnect();
        }
        this.updateUI();
        this.showInfo('Wallet disconnected');
    }

    updateUI() {
        const connectBtn = document.getElementById('connectWallet');
        if (connectBtn) {
            if (this.isConnected) {
                connectBtn.textContent = `${this.accountId.slice(0, 8)}...`;
                connectBtn.onclick = () => this.disconnectWallet();
            } else {
                connectBtn.textContent = 'Connect HashPack';
                connectBtn.onclick = () => this.connectWallet();
            }
        }

        // Update wallet status in other pages
        const walletStatus = document.querySelectorAll('.wallet-status');
        walletStatus.forEach(element => {
            if (this.isConnected) {
                element.textContent = `Connected: ${this.accountId}`;
                element.className = 'wallet-status text-green-600 text-sm';
            } else {
                element.textContent = 'Wallet not connected';
                element.className = 'wallet-status text-red-600 text-sm';
            }
        });
    }

    async sendTransaction(transaction) {
        if (!this.isConnected) {
            throw new Error('Wallet not connected');
        }

        try {
            const response = await this.hashconnect.sendTransaction(this.accountId, transaction);
            return response;
        } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm ${
            type === 'error' ? 'bg-red-500 text-white' :
            type === 'success' ? 'bg-green-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
}

// Global wallet manager instance
window.walletManager = new WalletManager();

