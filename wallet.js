import * as fs from 'fs';
import * as web3 from '@solana/web3.js';

const clusterEndpoint = 'https://api.devnet.solana.com';
const walletFile = 'wallet.json';

// Function to create Solana wallet and store it in the wallet.JSON
const createWallet = async () => {
  const newWallet = web3.Keypair.generate();
  const walletData = {
    privateKey: newWallet.secretKey.toString(),
    publicKey: newWallet.publicKey.toBase58(),
    balance: 0,
  };
  
  fs.writeFileSync(walletFile, JSON.stringify(walletData, null, 2));
  console.log('New Wallet Created:', walletData);
  return newWallet;
};

// Function to airdrop
const airdrop = async (amount: number = 1) => {
  const walletData = JSON.parse(fs.readFileSync(walletFile, 'utf8'));
  const connection = new web3.Connection(clusterEndpoint, 'confirmed');
  const publicKey = new web3.PublicKey(walletData.publicKey);
  
  await connection.requestAirdrop(publicKey, web3.LAMPORTS_PER_SOL * amount);
  console.log(`${amount} SOL Airdrop completed.`);
};

// Function to check current wallet balance
const checkBalance = async () => {
  const walletData = JSON.parse(fs.readFileSync(walletFile, 'utf8'));
  const connection = new web3.Connection(clusterEndpoint, 'confirmed');
  const publicKey = new web3.PublicKey(walletData.publicKey);
  
  const balance = await connection.getBalance(publicKey);
  console.log('Wallet Balance:', balance);
  walletData.balance = balance;
  fs.writeFileSync(walletFile, JSON.stringify(walletData, null, 2));
};

// Function to transfer SOL to another wallet address
const transfer = async (recipientAddress: string, amount: number) => {
  const walletData = JSON.parse(fs.readFileSync(walletFile, 'utf8'));
  const connection = new web3.Connection(clusterEndpoint, 'confirmed');
  const fromWallet = web3.Keypair.fromSecretKey(Buffer.from(walletData.privateKey, 'base64'));
  const toPublicKey = new web3.PublicKey(recipientAddress);
  
  const transaction = new web3.Transaction().add(
    web3.SystemProgram.transfer({
      fromPubkey: fromWallet.publicKey,
      toPubkey: toPublicKey,
      lamports: web3.LAMPORTS_PER_SOL * amount,
    })
  );
  
  const signature = await web3.sendAndConfirmTransaction(connection, transaction, [fromWallet]);
  console.log(`Transfer completed. Signature: ${signature}`);
};

// Command line argument handling
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'new':
    createWallet();
    break;
  
  case 'airdrop':
    const amount = args[1] ? parseFloat(args[1]) : 1;
    airdrop(amount);
    break;
  
  case 'balance':
    checkBalance();
    break;
  
  case 'transfer':
    const recipientAddress = args[1];
    const transferAmount = parseFloat(args[2]);
    transfer(recipientAddress, transferAmount);
    break;
  
  default:
    console.log('Invalid command. Valid commands: new, airdrop, balance, transfer');
}
