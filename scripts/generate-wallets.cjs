/**
 * BillHaven Wallet Generator
 *
 * Generates secure wallets for:
 * 1. Deployer Wallet - for smart contract deployment
 * 2. Oracle Wallet - for backend payment signing
 *
 * IMPORTANT: Save these keys securely! Never share them!
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(60));
console.log('🔐 BILLHAVEN WALLET GENERATOR');
console.log('='.repeat(60) + '\n');

// Generate Deployer Wallet
console.log('📦 DEPLOYER WALLET (for smart contract deployment)');
console.log('-'.repeat(50));
const deployerWallet = ethers.Wallet.createRandom();
console.log(`Address:     ${deployerWallet.address}`);
console.log(`Private Key: ${deployerWallet.privateKey}`);
console.log(`Mnemonic:    ${deployerWallet.mnemonic.phrase}`);
console.log('');

// Generate Oracle Wallet
console.log('🔮 ORACLE WALLET (for backend payment signing)');
console.log('-'.repeat(50));
const oracleWallet = ethers.Wallet.createRandom();
console.log(`Address:     ${oracleWallet.address}`);
console.log(`Private Key: ${oracleWallet.privateKey}`);
console.log(`Mnemonic:    ${oracleWallet.mnemonic.phrase}`);
console.log('');

// Generate Insurance Fund Wallet (optional)
console.log('🛡️  INSURANCE FUND WALLET (optional - for user protection)');
console.log('-'.repeat(50));
const insuranceWallet = ethers.Wallet.createRandom();
console.log(`Address:     ${insuranceWallet.address}`);
console.log(`Private Key: ${insuranceWallet.privateKey}`);
console.log(`Mnemonic:    ${insuranceWallet.mnemonic.phrase}`);
console.log('');

// Save to secure file
const walletData = {
  generated: new Date().toISOString(),
  warning: 'NEVER SHARE THESE KEYS! Store securely!',
  deployer: {
    address: deployerWallet.address,
    privateKey: deployerWallet.privateKey,
    mnemonic: deployerWallet.mnemonic.phrase,
    purpose: 'Smart contract deployment to blockchains',
    fundWith: '~$5-10 in POL/ETH for gas fees'
  },
  oracle: {
    address: oracleWallet.address,
    privateKey: oracleWallet.privateKey,
    mnemonic: oracleWallet.mnemonic.phrase,
    purpose: 'Backend payment verification signing',
    fundWith: 'No funding needed (signing only)'
  },
  insurance: {
    address: insuranceWallet.address,
    privateKey: insuranceWallet.privateKey,
    mnemonic: insuranceWallet.mnemonic.phrase,
    purpose: 'Insurance fund for user protection',
    fundWith: '3% of platform fees automatically'
  }
};

// Save to file (KEEP THIS SECURE!)
const outputPath = path.join(__dirname, '..', 'WALLETS_SECURE.json');
fs.writeFileSync(outputPath, JSON.stringify(walletData, null, 2));

console.log('='.repeat(60));
console.log('✅ WALLETS GENERATED SUCCESSFULLY');
console.log('='.repeat(60));
console.log('');
console.log('📁 Saved to: WALLETS_SECURE.json');
console.log('');
console.log('⚠️  CRITICAL SECURITY WARNINGS:');
console.log('   1. NEVER commit WALLETS_SECURE.json to git!');
console.log('   2. Store private keys in a password manager');
console.log('   3. Consider using a hardware wallet for production');
console.log('   4. Delete this file after copying keys to .env');
console.log('');
console.log('📋 NEXT STEPS:');
console.log('   1. Copy DEPLOYER private key to .env:');
console.log(`      DEPLOYER_PRIVATE_KEY=${deployerWallet.privateKey}`);
console.log('');
console.log('   2. Add ORACLE private key to Render dashboard:');
console.log(`      ORACLE_PRIVATE_KEY=${oracleWallet.privateKey}`);
console.log('');
console.log('   3. Fund the DEPLOYER wallet with POL:');
console.log(`      Send $5-10 POL to: ${deployerWallet.address}`);
console.log('');
console.log('   4. Update smart contract with ORACLE address:');
console.log(`      Oracle Address: ${oracleWallet.address}`);
console.log('');
console.log('='.repeat(60));
