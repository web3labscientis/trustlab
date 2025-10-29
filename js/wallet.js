// Wallet connection and management
class WalletManager {
    constructor() {
        this.isConnected = false;
        this.accountId = null;
        this.hashconnect = null;
        this.provider = null;
        this.signer = null;
    }

    async init() {
        try {
            // Check if HashPack is available
            if (typeof window.hashconnect === 'undefined') {
                console.log('HashConnect not found, loading...');
                await this.loadHashConnect();
            }
            
            this.hashconnect = new HashConnect();
            await this.hashconnect.init();
            
            // Set up event listeners
            this.hashconnect.foundExtensionEvent.on((walletMetadata) => {
                console.log('Found extension:', walletMetadata);
            });

            this.hashconnect.pairingEvent.on((pairingData) => {
                console.log('Paired with wallet:', pairingData);
                this.onWalletConnected(pairingData);
            });

            return true;
        } catch (error) {
            console.error('Failed to initialize wallet:', error);
            return false;
        }
    }

    async loadHashConnect() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/hashconnect@0.6.0/dist/hashconnect.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

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

