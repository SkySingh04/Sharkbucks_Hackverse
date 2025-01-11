// import { ethers } from "ethers";
// import StartupFunding from "../build/contracts/StartupFunding.json";

// // utils/contract.ts

// export async function createStartup(goal: number) {
//     const provider = new ethers.JsonRpcProvider("http://127.0.0.1:9545"); // Adjust the provider URL as needed
//     const signer = await provider.getSigner();
//     console.log(process.env.NEXT_PUBLIC_DEPLOYED_CONTRACT_ADDRESS);
//     const fundingAddress : any = process.env.NEXT_PUBLIC_DEPLOYED_CONTRACT_ADDRESS; // Replace with your contract address
//     const fundingAbi = StartupFunding.abi;

//     const fundingContract = new ethers.Contract(fundingAddress, fundingAbi, signer);

//     const tx = await fundingContract.createStartup(goal);
//     await tx.wait();
//     console.log("Startup created:", tx.hash);
// }

// export async function fundStartup(startupId: number, amount: number) {
//     const provider = new ethers.JsonRpcProvider("http://127.0.0.1:9545"); // Adjust the provider URL as needed
//     const signer = await provider.getSigner();
//     console.log(process.env.NEXT_PUBLIC_DEPLOYED_CONTRACT_ADDRESS);
//     const fundingAddress : any = process.env.NEXT_PUBLIC_DEPLOYED_CONTRACT_ADDRESS; // Replace with your contract address
//     const fundingAbi = StartupFunding.abi;

//     const fundingContract = new ethers.Contract(fundingAddress, fundingAbi, signer);

//     const tx = await fundingContract.fundStartup(startupId, { value: ethers.parseEther(amount.toString()) });
//     await tx.wait();
//     console.log("Startup funded:", tx.hash);
// }


// import { ethers } from "ethers";
// import StartupFunding from "../build/contracts/StartupFunding.json";

// // utils/contract.ts

// export async function createStartup(goal: number) {
//     const provider = new ethers.JsonRpcProvider("http://127.0.0.1:9545"); // Adjust the provider URL as needed
//     const signer = await provider.getSigner();
//     console.log(process.env.NEXT_PUBLIC_DEPLOYED_CONTRACT_ADDRESS);
//     const fundingAddress : any = process.env.NEXT_PUBLIC_DEPLOYED_CONTRACT_ADDRESS; // Replace with your contract address
//     const fundingAbi = StartupFunding.abi;

//     const fundingContract = new ethers.Contract(fundingAddress, fundingAbi, signer);

//     const tx = await fundingContract.createStartup(goal);
//     await tx.wait();
//     console.log("Startup created:", tx.hash);
// }

// export async function fundStartup(startupId: number, amount: number) {
//     const provider = new ethers.JsonRpcProvider("http://127.0.0.1:9545"); // Adjust the provider URL as needed
//     const signer = await provider.getSigner();
//     console.log(process.env.NEXT_PUBLIC_DEPLOYED_CONTRACT_ADDRESS);
//     const fundingAddress : any = process.env.NEXT_PUBLIC_DEPLOYED_CONTRACT_ADDRESS; // Replace with your contract address
//     const fundingAbi = StartupFunding.abi;

//     const fundingContract = new ethers.Contract(fundingAddress, fundingAbi, signer);

//     const tx = await fundingContract.fundStartup(startupId, { value: ethers.parseEther(amount.toString()) });
//     await tx.wait();
//     console.log("Startup funded:", tx.hash);
// }



// NEW CODE




import { Account, Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { updateDoc, doc } from "firebase/firestore";
// import dotenv from 'dotenv';

// // Load environment variables from .env file
// dotenv.config();
// Initialize Firebase app
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};


const app = initializeApp(firebaseConfig);
console.log(app);
const db = getFirestore(app);
const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
const COIN_STORE = `0x1::coin::CoinStore<${APTOS_COIN}>`;
const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);
 
async function get_acc_no(id: number) {
    const collectionRef = collection(db, "applications");
    
    // Create a query to filter by id
    const q = query(collectionRef, where("id", "==", id));
    
    // Get the documents that match the query
    const querySnapshot = await getDocs(q);
  
    // let data: { acc_no: string; goal: string } ;
    let data1: string ="";
  
    querySnapshot.forEach((doc) => {
      const data : any = doc.data();
      // Assuming you want to return the first matched document
      data1 = data["acc_no"] ;
    });
    
    // Return the data object of the first match or null if no match was found
    return data1;

}


  async function push_acc_no( id: number,  acc_hash: any) {
    const collectionRef = collection(db, "applications");
    
    // Create a query to find the document with the matching applicationId
    const q = query(collectionRef, where("applicationId", "==", id));
    
    // Get the matching documents
    const querySnapshot = await getDocs(q);
  
    // Check if a document with the applicationId exists and update it
    querySnapshot.forEach(async (docSnap) => {
      const docRef = doc(db, "applications", docSnap.id);
  
      // Update the field in the document
      await updateDoc(docRef, {
        ["acc_hash"]:  acc_hash,
         // Dynamically update the field with the provided value
      });
  
      console.log(`Field 'acc_hash' updated successfully for document with applicationId: ${id} and the hash is ${acc_hash}`);
    });
  }

export async function createStartup(startup_id: number){
    const startup_acc=Account.generate();
    console.log(`Startup created with hash:  ${startup_acc.accountAddress}`);
    try{
    push_acc_no(startup_id,startup_acc.accountAddress);}
    catch (error){
        console.error("Firebase errror!");
    }
}



export async function fundStartup(startupId: number, amt: number) {
    // Await the resolution of the asynchronous function
    const startup_acc = await get_acc_no(startupId);
    await aptos.fundAccount({
        accountAddress: startup_acc,
        amount:amt
    });
}