require('dotenv').config();
const { ethers } = require('ethers');

// Load environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;

// Contract address for the router (multicall)
const routerAddress = '0x31cAc5C91c483A637116934D21565361950e6b7F';

// ABI for multicall
const routerAbi = [
    'function multicall(uint256 deadline, bytes[] calldata data) external payable returns (bytes[] memory)',
];

// Example token addresses
const WETH_ADDRESS = '0xe26fea44c00802b9cae594974c0a6cbcad5fd863';  // WETH address
const USDT_ADDRESS = '0xcda75276918a66d609a55b04570d7b4015a974a0';   // USDT address

// Swap data
const swapData = [
    "0x472b43f3000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000fae07aa202000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000e26fea44c00802b9cae594974c0a6cbcad5fd863000000000000000000000000cda75276918a66d609a55b04570d7b4015a974a0"
];

// Set deadline and convert the swap data to bytes
let deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes from now
const bytesData = swapData.map(ethers.utils.hexlify);

// Fungsi untuk koneksi ulang ke RPC jika gagal
async function connectToRpc() {
    while (true) {
        try {
            // Setup provider and signer
            const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
            const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

            // Test koneksi dengan mengambil balance
            await provider.getBlockNumber();
            console.log("Berhasil terhubung ke RPC.");
            return { provider, wallet };
        } catch (error) {
            console.error("Gagal terhubung ke RPC. Mencoba ulang dalam 5 detik...");
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

async function performSwap(index, provider, wallet) {
    try {
        // Buat instance kontrak router
        const routerContract = new ethers.Contract(routerAddress, routerAbi, wallet);

        // Check wallet balance
        const balance = await provider.getBalance(wallet.address);
        const balanceInEth = ethers.utils.formatEther(balance);

        // Stop if balance is less than 1 ETH
        if (parseFloat(balanceInEth) < 1) {
            console.log("Balance below 1 ATLA. Stopping the script.");
            process.exit(0); // Exit the script
        }

        // Define the value to send in ETH (0.1 ETH)
        const valueInEth = ethers.utils.parseEther('0.1');

        // Estimate gas limit
        const gasEstimate = await routerContract.estimateGas.multicall(
            deadline,
            bytesData,
            {
                value: valueInEth
            }
        );

        // Get current gas price
        const gasPrice = await provider.getGasPrice();

        // Call multicall function on the contract
        const tx = await routerContract.multicall(
            deadline,
            bytesData,
            {
                value: valueInEth, // Sending 0.1 ETH
                gasLimit: gasEstimate, // Set gas limit
                gasPrice: gasPrice // Set gas price
            }
        );

        const receipt = await tx.wait();

        console.log(`Balance\t\t\t: ${balanceInEth.slice(0, 5)} ATLA`);
        console.log(`Transaction hash\t: ${tx.hash.slice(0, 10)}... `);
        console.log(`Block\t\t\t: ${receipt.blockNumber}\n`);

    } catch (error) {
        console.error(`Failed\t\t:`, error.message);
    }
}

async function run() {
    let index = 1;
    
    // Koneksikan ke RPC, ulangi jika gagal
    const { provider, wallet } = await connectToRpc();

    while (true) {
        await performSwap(index, provider, wallet);
        index++;
        // Delay between swaps (5 seconds)
        await new Promise(resolve => setTimeout(resolve, 5 * 1000));

        // Perbarui deadline setelah setiap percobaan
        deadline = Math.floor(Date.now() / 1000) + 60 * 10;
    }
}

run();
