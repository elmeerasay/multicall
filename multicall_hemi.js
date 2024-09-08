require('dotenv').config();
const { ethers } = require('ethers');

// Mendapatkan data dari .env
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// RPC provider dan signer menggunakan private key
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// ABI untuk metode yang akan dipanggil
const contractAbi = [
    "function execute(bytes commands, bytes[] inputs, uint256 deadline)"
];

// Alamat kontrak pintar
const contractAddress = "0xA18019E62f266C2E17e33398448e4105324e0d0F";

// Membuat instance kontrak
const contract = new ethers.Contract(contractAddress, contractAbi, wallet);

// Contoh input data
const commands = "0x00";  // Masukkan commands dalam format bytes
const inputs = [
    "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000f42400000000000000000000000000000000000000000000000000f0bd87b6eaa1e4a00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000423adf21a6cbc9ce6d5a3ea401e7bae9499d3912980000640c8afd1b58aa2a5bad2414b861d8a7ff898edc3a000bb8ec46e0efb2ea8152da0327a5eb3ff9a43956f13e000000000000000000000000000000000000000000000000000000000000"
];  // Masukkan array inputs sesuai format bytes
let deadline = Math.floor(Date.now() / 1000) + 3600; // Contoh deadline 1 jam dari sekarang
let i = 1;
async function sendTransaction() {
    while (true) {
        try {
            //console.log(`${i}. Mengirim transaksi...`);
            // Memanggil metode execute
            const tx = await contract.execute(commands, inputs, deadline);

            // Menunggu konfirmasi transaksi
            //console.log("Menunggu konfirmasi transaksi...");
            const receipt = await tx.wait();
            console.log(`${i}. Sukses\t: ${receipt.blockNumber}`);
            i++;
            //break; // Keluar dari loop jika transaksi berhasil
        } catch (error) {
            console.error("Gagal mengirim transaksi:", error.reason || error.message);
            console.log("Retrying in 5 seconds...");
            // Tunggu 5 detik sebelum mencoba lagi
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Perbarui deadline untuk transaksi berikutnya jika diperlukan
            deadline = Math.floor(Date.now() / 1000) + 3600; // Perbarui deadline 1 jam dari saat ini
            
        }
    }
}

sendTransaction();
