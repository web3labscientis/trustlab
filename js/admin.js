// Admin page functionality
class AdminManager {
    constructor() {
        this.uploadedResults = [];
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDate();
    }

    setupEventListeners() {
        // Upload form submission
        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleUpload();
            });
        }

        // Connect wallet button
        const connectWalletAdmin = document.getElementById('connectWalletAdmin');
        if (connectWalletAdmin) {
            connectWalletAdmin.addEventListener('click', () => {
                if (window.walletManager) {
                    window.walletManager.connectWallet();
                }
            });
        }

        // Copy verification code
        const copyCodeBtn = document.getElementById('copyCodeBtn');
        if (copyCodeBtn) {
            copyCodeBtn.addEventListener('click', () => {
                this.copyVerificationCode();
            });
        }

        // Download QR code
        const downloadQrBtn = document.getElementById('downloadQrBtn');
        if (downloadQrBtn) {
            downloadQrBtn.addEventListener('click', () => {
                this.downloadQrCode();
            });
        }
    }

    setDefaultDate() {
        const testDateInput = document.getElementById('testDate');
        if (testDateInput) {
            const today = new Date().toISOString().split('T')[0];
            testDateInput.value = today;
        }
    }

    async handleUpload() {
        // Validate wallet connection
        if (!window.walletManager || !window.walletManager.isConnected) {
            this.showError('Please connect your wallet first to upload results to the blockchain');
            return;
        }

        // Validate form
        if (!window.utils.validateForm('uploadForm')) {
            this.showError('Please fill in all required fields');
            return;
        }

        // Get form data
        const formData = new FormData(document.getElementById('uploadForm'));
        const resultData = {
            patientId: formData.get('patientId'),
            patientName: formData.get('patientName'),
            testName: formData.get('testName'),
            testResult: formData.get('testResult'),
            testDate: formData.get('testDate'),
            providerName: formData.get('providerName'),
            notes: formData.get('notes') || '',
            requiresPayment: formData.get('requiresPayment') === 'on',
            timestamp: new Date().toISOString()
        };

        // Show loading state
        const submitBtn = document.querySelector('#uploadForm button[type="submit"]');
        const originalText = submitBtn.textContent;
        window.utils.addLoadingState(submitBtn, originalText);

        try {
            // Generate verification code
            const verificationCode = window.utils.generateVerificationCode();
            
            // Create data hash (simulate)
            const dataHash = await this.generateDataHash(resultData);
            
            // Simulate blockchain transaction
            const transactionResult = await this.submitToBlockchain(resultData, dataHash);
            
            // Store result
            const uploadResult = {
                ...resultData,
                verificationCode,
                dataHash,
                transactionId: transactionResult.transactionId,
                blockHash: transactionResult.blockHash,
                verified: true
            };
            
            this.uploadedResults.push(uploadResult);
            
            // Display generated result
            await this.displayGeneratedResult(uploadResult);
            
            // Clear form
            document.getElementById('uploadForm').reset();
            this.setDefaultDate();
            
            this.showSuccess('Test result successfully uploaded to blockchain!');
            
        } catch (error) {
            console.error('Upload error:', error);
            this.showError('Failed to upload result to blockchain. Please try again.');
        } finally {
            window.utils.removeLoadingState(submitBtn, originalText);
        }
    }

    async generateDataHash(data) {
        // Simulate hash generation (in real implementation, use proper cryptographic hash)
        const dataString = JSON.stringify(data);
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(dataString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return '0x' + hashHex.substring(0, 32) + '...';
    }

    async submitToBlockchain(data, hash) {
        // Simulate blockchain transaction (in real implementation, use Hedera SDK)
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        return {
            transactionId: '0.0.' + Math.floor(Math.random() * 1000000) + '@' + Date.now(),
            blockHash: '0x' + Math.random().toString(16).substring(2, 18) + '...',
            status: 'SUCCESS'
        };
    }

    async displayGeneratedResult(result) {
        const generatedResult = document.getElementById('generatedResult');
        const verificationCodeElement = document.getElementById('verificationCode');
        const transactionIdElement = document.getElementById('transactionId');
        const blockHashElement = document.getElementById('blockHash');
        const transactionStatusElement = document.getElementById('transactionStatus');

        // Display verification code
        verificationCodeElement.textContent = result.verificationCode;
        
        // Display transaction details
        transactionIdElement.textContent = result.transactionId;
        blockHashElement.textContent = result.blockHash;
        transactionStatusElement.textContent = 'Confirmed';

        // Generate QR code
        await this.generateQrCode(result.verificationCode);

        // Show the result section
        generatedResult.classList.remove('hidden');
        generatedResult.scrollIntoView({ behavior: 'smooth' });

        // Update recent uploads
        this.updateRecentUploads();
    }

    async generateQrCode(verificationCode) {
        const canvas = document.getElementById('qrCodeCanvas');
        if (!canvas) return;

        try {
            // Create QR code data (could be JSON with more info)
            const qrData = {
                code: verificationCode,
                url: window.location.origin + '/pages/verify.html?code=' + verificationCode,
                platform: 'TrustaLab'
            };

            // Generate QR code
            await QRCode.toCanvas(canvas, JSON.stringify(qrData), {
                width: 200,
                margin: 2,
                color: {
                    dark: '#1E40AF',  // Dark blue
                    light: '#FFFFFF'  // White
                }
            });
        } catch (error) {
            console.error('Error generating QR code:', error);
            this.showError('Failed to generate QR code');
        }
    }

    copyVerificationCode() {
        const verificationCode = document.getElementById('verificationCode').textContent;
        if (window.utils.copyToClipboard(verificationCode)) {
            this.showSuccess('Verification code copied to clipboard!');
        } else {
            this.showError('Failed to copy verification code');
        }
    }

    downloadQrCode() {
        const canvas = document.getElementById('qrCodeCanvas');
        if (!canvas) return;

        try {
            // Create download link
            const link = document.createElement('a');
            link.download = 'trustalab-qr-code.png';
            link.href = canvas.toDataURL();
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showSuccess('QR code downloaded successfully!');
        } catch (error) {
            console.error('Error downloading QR code:', error);
            this.showError('Failed to download QR code');
        }
    }

    updateRecentUploads() {
        const recentUploads = document.getElementById('recentUploads');
        if (!recentUploads) return;

        // Get last 5 uploads
        const recentResults = this.uploadedResults.slice(-5).reverse();
        
        // Clear existing content
        recentUploads.innerHTML = '';

        // Add new uploads
        recentResults.forEach(result => {
            const uploadElement = document.createElement('div');
            uploadElement.className = 'bg-white/10 rounded-lg p-4';
            
            const date = new Date(result.testDate).toLocaleDateString();
            
            uploadElement.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-semibold text-white">${result.testName}</h3>
                    <span class="text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded">Verified</span>
                </div>
                <p class="text-white/80 text-sm">Patient: ${result.patientId} | Date: ${date}</p>
                <p class="text-white/60 text-xs">Code: ${result.verificationCode}</p>
            `;
            
            recentUploads.appendChild(uploadElement);
        });

        // If no uploads, show default content
        if (recentResults.length === 0) {
            recentUploads.innerHTML = `
                <div class="text-center text-white/60 py-8">
                    <p>No recent uploads. Upload your first test result to get started.</p>
                </div>
            `;
        }
    }

    showError(message) {
        if (window.walletManager) {
            window.walletManager.showError(message);
        } else {
            alert('Error: ' + message);
        }
    }

    showSuccess(message) {
        if (window.walletManager) {
            window.walletManager.showSuccess(message);
        } else {
            alert('Success: ' + message);
        }
    }

    showInfo(message) {
        if (window.walletManager) {
            window.walletManager.showInfo(message);
        } else {
            alert('Info: ' + message);
        }
    }
}

// Initialize admin manager when page loads
document.addEventListener('DOMContentLoaded', function() {
    const adminManager = new AdminManager();
    adminManager.init();
    
    // Make it globally available
    window.adminManager = adminManager;
});

