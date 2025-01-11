'use client';

import { useState } from 'react';
import { Account, Aptos, AptosConfig, Network, } from '@aptos-labs/ts-sdk';

export default function AltPaymentsPage() {
    const [amount, setAmount] = useState<number | "">(0);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [transactionHash, setTransactionHash] = useState<string | null>(null);

    const config = new AptosConfig({ network: Network.DEVNET });
    const aptos = new Aptos(config);

    // Handle payment logic when the user clicks the "Send Payment" button
    const handlePayment = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setLoading(true);
        setError(null);
        setMessage('Processing payment...');

        try {
            const investorAccount = Account.generate();
            const startupAccount = Account.generate();

            await aptos.fundAccount({ accountAddress: investorAccount.accountAddress, amount: 100_000_000 });
            await aptos.fundAccount({ accountAddress: startupAccount.accountAddress, amount: 1_000 });

            const transaction = await aptos.transferCoinTransaction({
                sender: investorAccount.accountAddress,
                recipient: startupAccount.accountAddress,
                amount: amount,
            });

            const pendingTxn = await aptos.signAndSubmitTransaction({
                signer: investorAccount,
                transaction,
            });

            const response = await aptos.waitForTransaction({
                transactionHash: pendingTxn.hash,
            });


            console.log("Transaction submitted. Hash:", response.hash);
            
            setTransactionHash(response.hash);
            setMessage(`Payment successful! Hash: ${transactionHash}`);

        } catch (error: any) {
            console.error('Payment error:', error);
            setError(error.message || 'Payment failed');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="p-6 max-w-lg mx-auto bg-white shadow-lg rounded-lg">
            <h1 className="text-2xl font-bold mb-6">Make a Payment</h1>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Amount</label>
                <input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.000001"
                    disabled={loading}
                />
            </div>

            <button
                onClick={handlePayment}
                disabled={loading || !amount}
                className={`w-full p-3 rounded text-white transition-colors ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
            >
                {loading ? (
                    <span className="flex items-center justify-center">Processing...</span>
                ) : (
                    "Send Payment"
                )}
            </button>

            {message && !error && (
                <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                    {message}
                    <br />
                    <a
                        href={`https://explorer.aptoslabs.com/txn/${transactionHash}/userTxnOverview?network=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Click here to verify transaction
                    </a>
                </div>
            )}

        </div>
    );
}
