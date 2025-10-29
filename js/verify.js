// Verification page functionality
class VerificationManager {
    constructor() {
        this.isScanning = false;
        this.stream = null;
        this.video = null;
        this.canvas = null;
        this.context = null;
        this.scanInterval = null;
        
        // Mock database of verification codes for demo
        this.mockResults = {
            'ABC12345': {
                patientId: 'P001',
                testName: 'Blood Test - Complete Blood Count',
                result: 'Normal',
                date: '2024-09-20',
                provider: 'City General Hospital',
                verified: true,
                hash: '0x1234567890abcdef...',
                requiresPayment: false
            },
            'XYZ98765': {
                patientId: 'P002',
                testName: 'COVID-19 PCR Test',
                result: 'Negative',
                date: '2024-09-21',
                provider: 'HealthLab Diagnostics',
                verified: true,
                hash: '0xabcdef1234567890...',
                requiresPayment: true
            },
            'DEF54321': {
                patientId: 'P003',
                testName: 'Lipid Profile',
                result: 'Elevated Cholesterol',
                date: '2024-09-19',
                provider: 'Metro Medical Center',
                verified: true,
                hash: '0x9876543210fedcba...',
                requiresPayment: false
            }
        };
    }

    init() {
        this.video = document.getElementById('qrVideo');
        this.canvas = document.getElementById('qrCanvas');
        if (this.canvas) {
            this.context = this.canvas.getContext('2d');
        }

        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Verify form submission
        const verifyForm = document.getElementById('verifyForm');
        if (verifyForm) {
            verifyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleVerification();
            });
        }

        // QR scanner buttons
        const startQrBtn = document.getElementById('startQrScan');
        const stopQrBtn = document.getElementById('stopQrScan');
        
        if (startQrBtn) {
            startQrBtn.addEventListener('click', () => this.startQrScanner());
        }
        
        if (stopQrBtn) {
            stopQrBtn.addEventListener('click', () => this.stopQrScanner());
        }

        // Connect wallet button
        const connectWalletVerify = document.getElementById('connectWalletVerify');
        if (connectWalletVerify) {
            connectWalletVerify.addEventListener('click', () => {
                if (window.walletManager) {
                    window.walletManager.connectWallet();
                }
            });
        }

        // Payment button
        const payButton = document.getElementById('payButton');
        if (payButton) {
            payButton.addEventListener('click', () => this.handlePayment());
        }

        // Format verification code input
        const verificationCodeInput = document.getElementById('verificationCode');
        if (verificationCodeInput) {
            verificationCodeInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            });
        }
    }

    async handleVerification() {
        const verificationCode = document.getElementById('verificationCode').value.trim();
        
        if (!verificationCode) {
            this.showError('Please enter a verification code');
            return;
        }

        if (verificationCode.length !== 8) {
            this.showError('Verification code must be 8 characters long');
            return;
        }

        // Show loading state
        const submitBtn = verifyForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        window.utils.addLoadingState(submitBtn, originalText);

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check if code exists in mock database
            const result = this.mockResults[verificationCode];
            
            if (result) {
                this.displayVerificationResult(result, verificationCode);
            } else {
                this.displayVerificationResult(null, verificationCode);
            }
        } catch (error) {
            console.error('Verification error:', error);
            this.showError('Verification failed. Please try again.');
        } finally {
            window.utils.removeLoadingState(submitBtn, originalText);
        }
    }

    async startQrScanner() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            
            this.video.srcObject = this.stream;
            this.video.play();
            
            this.isScanning = true;
            
            // Show/hide elements
            document.getElementById('qrReaderContainer').classList.remove('hidden');
            document.getElementById('startQrScan').classList.add('hidden');
            document.getElementById('stopQrScan').classList.remove('hidden');
            
            // Start scanning
            this.scanInterval = setInterval(() => {
                this.scanQrCode();
            }, 100);
            
        } catch (error) {
            console.error('Error starting QR scanner:', error);
            this.showError('Unable to access camera. Please check permissions.');
        }
    }

    stopQrScanner() {
        this.isScanning = false;
        
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        // Show/hide elements
        document.getElementById('qrReaderContainer').classList.add('hidden');
        document.getElementById('startQrScan').classList.remove('hidden');
        document.getElementById('stopQrScan').classList.add('hidden');
    }

    scanQrCode() {
        if (!this.isScanning || !this.video || this.video.readyState !== this.video.HAVE_ENOUGH_DATA) {
            return;
        }

        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        
        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        if (typeof jsQR !== 'undefined') {
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                this.stopQrScanner();
                this.processQrCode(code.data);
            }
        }
    }

    async processQrCode(qrData) {
        try {
            // Assume QR code contains the verification code
            let verificationCode = qrData;
            
            // If QR contains JSON or URL, extract the code
            if (qrData.startsWith('{')) {
                const data = JSON.parse(qrData);
                verificationCode = data.code || data.verificationCode;
            } else if (qrData.includes('verify=')) {
                const url = new URL(qrData);
                verificationCode = url.searchParams.get('verify');
            }
            
            if (verificationCode) {
                // Update the input field
                document.getElementById('verificationCode').value = verificationCode.toUpperCase();
                
                // Automatically verify
                await this.handleVerification();
            } else {
                this.showError('Invalid QR code format');
            }
        } catch (error) {
            console.error('Error processing QR code:', error);
            this.showError('Unable to process QR code');
        }
    }

    displayVerificationResult(result, code) {
        const resultContainer = document.getElementById('verificationResult');
        const resultIcon = document.getElementById('resultIcon');
        const resultTitle = document.getElementById('resultTitle');
        const resultMessage = document.getElementById('resultMessage');
        const resultDetails = document.getElementById('resultDetails');
        const paymentSection = document.getElementById('paymentSection');
        
        if (result && result.verified) {
            // Verified result
            resultIcon.innerHTML = `
                <svg class="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
            `;
            resultIcon.className = 'w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-green-500/20';
            
            resultTitle.textContent = 'Result Verified ✓';
            resultMessage.textContent = 'This medical test result is authentic and verified on the blockchain.';
            
            resultDetails.innerHTML = `
                <div class="grid md:grid-cols-2 gap-4">
                    <div class="bg-white/10 rounded-lg p-4">
                        <h4 class="font-semibold text-white mb-2">Patient Information</h4>
                        <p class="text-white/80 text-sm">Patient ID: ${result.patientId}</p>
                    </div>
                    <div class="bg-white/10 rounded-lg p-4">
                        <h4 class="font-semibold text-white mb-2">Test Details</h4>
                        <p class="text-white/80 text-sm">Test: ${result.testName}</p>
                        <p class="text-white/80 text-sm">Date: ${result.date}</p>
                    </div>
                    <div class="bg-white/10 rounded-lg p-4">
                        <h4 class="font-semibold text-white mb-2">Result</h4>
                        <p class="text-white font-semibold">${result.result}</p>
                    </div>
                    <div class="bg-white/10 rounded-lg p-4">
                        <h4 class="font-semibold text-white mb-2">Provider</h4>
                        <p class="text-white/80 text-sm">${result.provider}</p>
                    </div>
                </div>
                <div class="mt-4 bg-white/10 rounded-lg p-4">
                    <h4 class="font-semibold text-white mb-2">Blockchain Verification</h4>
                    <p class="text-white/80 text-sm">Hash: ${result.hash}</p>
                    <p class="text-white/80 text-sm">Verification Code: ${code}</p>
                    <p class="text-green-400 text-sm font-medium">✓ Verified on Hedera Ledger</p>
                </div>
            `;
            
            // Show payment section if required
            if (result.requiresPayment) {
                paymentSection.classList.remove('hidden');
            }
            
        } else {
            // Invalid result
            resultIcon.innerHTML = `
                <svg class="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                </svg>
            `;
            resultIcon.className = 'w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-500/20';
            
            resultTitle.textContent = 'Verification Failed ✗';
            resultMessage.textContent = 'The verification code you entered is invalid or the result could not be found.';
            
            resultDetails.innerHTML = `
                <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <h4 class="font-semibold text-red-400 mb-2">Possible Reasons:</h4>
                    <ul class="text-red-300 text-sm space-y-1">
                        <li>• Incorrect verification code</li>
                        <li>• Result not yet uploaded to the blockchain</li>
                        <li>• Expired verification code</li>
                        <li>• Technical issue with the verification system</li>
                    </ul>
                </div>
                <div class="bg-white/10 rounded-lg p-4 mt-4">
                    <h4 class="font-semibold text-white mb-2">What to do next:</h4>
                    <p class="text-white/80 text-sm">Please double-check your verification code or contact your healthcare provider for assistance.</p>
                </div>
            `;
        }
        
        resultContainer.classList.remove('hidden');
        resultContainer.scrollIntoView({ behavior: 'smooth' });
    }

    async handlePayment() {
        if (!window.walletManager || !window.walletManager.isConnected) {
            this.showError('Please connect your wallet first');
            return;
        }

        const payButton = document.getElementById('payButton');
        const originalText = payButton.textContent;
        
        try {
            window.utils.addLoadingState(payButton, originalText);
            
            // Simulate payment transaction
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // In a real implementation, this would create and send a Hedera transaction
            this.showSuccess('Payment successful! Transaction recorded on blockchain.');
            
            // Hide payment section
            document.getElementById('paymentSection').classList.add('hidden');
            
        } catch (error) {
            console.error('Payment error:', error);
            this.showError('Payment failed. Please try again.');
        } finally {
            window.utils.removeLoadingState(payButton, originalText);
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
}

// Initialize verification manager when page loads
document.addEventListener('DOMContentLoaded', function() {
    const verificationManager = new VerificationManager();
    verificationManager.init();
    
    // Make it globally available
    window.verificationManager = verificationManager;
});

