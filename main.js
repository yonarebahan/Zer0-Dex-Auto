console.clear();
console.log(`
                      .^!!^.
                  .:~7?7!7??7~:.
               :^!77!~:..^^~7?J?!^.
           .^!7??!^..  ..^^^^^~JJJJ7~:.
           7?????: ...^!7?!^^^~JJJJJJJ?.
           7?????:...^???J7^^^~JJJJJJJJ.
           7?????:...^??7?7^^^~JJJJJJJ?.
           7?????:...^~:.^~^^^~JJJJJJJ?.
           7?????:.. .:^!7!~^^~7?JJJJJ?.
           7?????:.:~JGP5YJJ?7!^^~7?JJ?.
           7?7?JY??JJ5BBBBG5YJJ?7!~7JJ?.
           7Y5GBBYJJJ5BBBBBBBGP5Y5PGP5J.
           ^?PBBBP555PBBBBBBBBBBBB#BPJ~
              :!YGB#BBBBBBBBBBBBGY7^
                 .~?5BBBBBBBBPJ~.
                     :!YGGY7:
                        ..

 🚀 join channel Airdrop Sambil Rebahan : https://t.me/kingfeeder
`);

require('dotenv').config();
const { ethers } = require('ethers');

const RPC_URL = 'https://evmrpc-testnet.0g.ai';
const routerAddress = '0xb95B5953FF8ee5D5d9818CdbEfE363ff2191318c';
const zer0dexAddress = process.env.ZER0DEX_CONTRACT;

const TOKENS = [
  { symbol: 'USDT', address: process.env.USDT_TOKEN },
  { symbol: 'BTC', address: process.env.BTC_TOKEN },
  { symbol: 'ETH', address: process.env.ETH_TOKEN }
];

const FEE = 100; // 0.01%

const routerAbi = [
  "function exactInputSingle(tuple(address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 amountIn,uint256 amountOutMinimum,uint256 deadline,uint160 sqrtPriceLimitX96)) external payable returns (uint256)"
];

const zer0dexAbi = [
  {
    "inputs": [
      {
        "components": [
          { "internalType": "address", "name": "token0", "type": "address" },
          { "internalType": "address", "name": "token1", "type": "address" },
          { "internalType": "uint24", "name": "fee", "type": "uint24" },
          { "internalType": "int24", "name": "tickLower", "type": "int24" },
          { "internalType": "int24", "name": "tickUpper", "type": "int24" },
          { "internalType": "uint256", "name": "amount0Desired", "type": "uint256" },
          { "internalType": "uint256", "name": "amount1Desired", "type": "uint256" },
          { "internalType": "uint256", "name": "amount0Min", "type": "uint256" },
          { "internalType": "uint256", "name": "amount1Min", "type": "uint256" },
          { "internalType": "address", "name": "recipient", "type": "address" },
          { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "internalType": "struct MintParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const erc20Abi = [
  "function balanceOf(address) view returns (uint)",
  "function approve(address spender, uint amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const pairs = [
  ["ETH", "BTC"],
  ["ETH", "USDT"],
  ["BTC", "USDT"]
];

function getRandomTokenPair() {
  let i = Math.floor(Math.random() * TOKENS.length);
  let j;
  do {
    j = Math.floor(Math.random() * TOKENS.length);
  } while (j === i);
  return [TOKENS[i], TOKENS[j]];
}

function getRandomPercentage(min = 0.01, max = 0.05) {
  return Math.random() * (max - min) + min;
}

function getRandomPercent(min = 10, max = 15) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDelay(minSec = 10, maxSec = 20) {
  const ms = Math.floor(Math.random() * (maxSec - minSec + 1) + minSec) * 1000;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const swapCount = parseInt(process.env.SWAP_COUNT || '3', 10);

  const wallets = Object.entries(process.env)
    .filter(([k, v]) => k.startsWith("PRIVATE_KEY") && v.startsWith("0x") && v.length === 66)
    .map(([_, v]) => v);

  for (let w = 0; w < wallets.length; w++) {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(wallets[w], provider);
    const walletAddress = ethers.getAddress(await wallet.getAddress());

    console.log(`\n\u{1F4BC} Wallet #${w + 1}: ${walletAddress}`);

    const router = new ethers.Contract(routerAddress, routerAbi, wallet);
    const dex = new ethers.Contract(zer0dexAddress, zer0dexAbi, wallet);

    // === SWAP ===
    for (let i = 0; i < swapCount; i++) {
      const [fromToken, toToken] = getRandomTokenPair();
      const token = new ethers.Contract(fromToken.address, erc20Abi, wallet);

      const decimals = await token.decimals();
      const balance = await token.balanceOf(walletAddress);
      if (balance === 0n) {
        console.log(`Saldo ${fromToken.symbol} kosong. Skip.`);
        continue;
      }

      const percentage = getRandomPercentage();
      const amountIn = BigInt(Math.floor(Number(balance) * percentage));
      const amountOutMin = amountIn / 2n;

      const allowance = await token.allowance(walletAddress, routerAddress);
      if (allowance < amountIn) {
        console.log(`Approving ${fromToken.symbol}...`);
        const approveTx = await token.approve(routerAddress, amountIn);
        await approveTx.wait();
      }

      const deadline = Math.floor(Date.now() / 1000) + 600;

      const params = {
        tokenIn: fromToken.address,
        tokenOut: toToken.address,
        fee: FEE,
        recipient: walletAddress,
        amountIn,
        amountOutMinimum: amountOutMin,
        sqrtPriceLimitX96: 0,
        deadline: BigInt(deadline)
      };

      console.log(`\u{1F501} Swap ${fromToken.symbol} → ${toToken.symbol} | Amount: ${ethers.formatUnits(amountIn, decimals)}`);

      try {
        const tx = await router.exactInputSingle(params, { gasLimit: 300000n });
        const receipt = await tx.wait();
        console.log(`✅ Swap Success! Tx Hash: ${receipt.hash}`);
      } catch (err) {
        console.error(`❌ Gagal swap ${fromToken.symbol} → ${toToken.symbol}:`, err?.shortMessage || err);
      }

      await getRandomDelay();
    }

    // === MINT ===
    const totalRuns = Math.floor(Math.random() * 5) + 1;
    console.log(`\n🔁 Mulai ${totalRuns} aksi add liquidity`);

    for (let r = 1; r <= totalRuns; r++) {
      const [name0, name1] = pairs[Math.floor(Math.random() * pairs.length)];
      const addr0 = process.env[`${name0}_TOKEN`];
      const addr1 = process.env[`${name1}_TOKEN`];

      const token0 = new ethers.Contract(addr0, erc20Abi, wallet);
      const token1 = new ethers.Contract(addr1, erc20Abi, wallet);

      const bal0 = await token0.balanceOf(walletAddress);
      const bal1 = await token1.balanceOf(walletAddress);

      if (bal0 === 0n || bal1 === 0n) {
        console.log(`[${r}] ❌ Saldo ${name0}/${name1} kosong. Skip.`);
        continue;
      }

      const dec0 = await token0.decimals();
      const dec1 = await token1.decimals();

      const pct0 = getRandomPercent();
      const pct1 = getRandomPercent();
      const amt0 = bal0 * BigInt(pct0) / 100n;
      const amt1 = bal1 * BigInt(pct1) / 100n;

      console.log(`\n[${r}] ✅ Add liquidity ${name0}/${name1}`);
      console.log(`→ ${pct0}% ${name0}: ${ethers.formatUnits(amt0, dec0)}`);
      console.log(`→ ${pct1}% ${name1}: ${ethers.formatUnits(amt1, dec1)}`);

      await token0.approve(zer0dexAddress, amt0);
      await token1.approve(zer0dexAddress, amt1);

      const deadline = Math.floor(Date.now() / 1000) + 300;

      const mintParams = [
        addr0,
        addr1,
        3000,
        -887220,
        887220,
        amt0,
        amt1,
        0,
        0,
        walletAddress,
        deadline
      ];

      try {
        const tx = await dex.mint(mintParams, { gasLimit: 600000 });
        console.log(`[${r}] 🚀 TX terkirim: ${tx.hash}`);
        await tx.wait();
        console.log(`[${r}] 🎉 Sukses!`);
      } catch (err) {
        console.error(`[${r}] ❌ Gagal mint:`, err.message);
      }

      if (r < totalRuns) await getRandomDelay();
    }

    console.log(`\n✅ Semua aksi selesai untuk wallet ${walletAddress}`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
