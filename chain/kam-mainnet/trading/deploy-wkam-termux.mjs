import fs from "fs";
import solc from "solc";
import { ethers } from "ethers";

const RPC = "https://rpc.kriptoaman.com";
const EXPECTED_CHAIN_ID = 22028n;

const provider = new ethers.JsonRpcProvider(RPC);
const network = await provider.getNetwork();

console.log("Chain ID:", network.chainId.toString());

if (network.chainId !== EXPECTED_CHAIN_ID) {
  throw new Error(`SALAH JARINGAN: ${network.chainId}`);
}

const block = await provider.getBlockNumber();
console.log("Current block:", block);

const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
if (!privateKey) {
  throw new Error("DEPLOYER_PRIVATE_KEY belum diisi");
}

const source = fs.readFileSync("./contracts/WKAM.sol", "utf8");

const input = {
  language: "Solidity",
  sources: {
    "WKAM.sol": { content: source }
  },
  settings: {
    evmVersion: "paris",
    optimizer: {
      enabled: true,
      runs: 200
    },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"]
      }
    }
  }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  for (const err of output.errors) {
    console.log(err.formattedMessage);
  }

  if (output.errors.some(e => e.severity === "error")) {
    process.exit(1);
  }
}

const contract = output.contracts["WKAM.sol"]["WKAM"];

const wallet = new ethers.Wallet(privateKey, provider);

console.log("Deployer:", wallet.address);

const balance = await provider.getBalance(wallet.address);
console.log("Balance KAM:", ethers.formatEther(balance));

if (balance === 0n) {
  throw new Error("Wallet deployer tidak memiliki KAM untuk gas");
}

const factory = new ethers.ContractFactory(
  contract.abi,
  "0x" + contract.evm.bytecode.object,
  wallet
);

console.log("Deploying WKAM...");

const deployed = await factory.deploy();

console.log("TX HASH:", deployed.deploymentTransaction().hash);

await deployed.waitForDeployment();

const address = await deployed.getAddress();

console.log("=====================================");
console.log("WKAM CONTRACT ADDRESS:", address);
console.log("TX HASH:", deployed.deploymentTransaction().hash);
console.log("EXPLORER:", `https://explorer.kriptoaman.com/address/${address}`);
console.log("=====================================");
