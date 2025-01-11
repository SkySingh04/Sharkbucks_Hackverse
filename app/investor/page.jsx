    'use client'
    import { useState, useEffect } from "react";
    import { doc, collection, getDoc, getDocs, updateDoc } from "firebase/firestore";
    import { db, auth } from '../firebase';
    import { useRouter } from "next/navigation";
    import { onAuthStateChanged } from "firebase/auth";
    import { ToastContainer, toast } from 'react-toastify';
    import 'react-toastify/dist/ReactToastify.css';
    import { fundStartup } from "../utils/contracts";
    import Chatbot from '../components/Chatbot';
    import './page.css';

    const Modal = ({ isOpen, onClose, transactionHash }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-gray-900 text-white p-8 rounded-lg max-w-md w-full">
                    <h2 className="text-xl font-bold mb-4">Payment Successful!</h2>
                    <div className="mb-6">
                        <p className="mb-4">Thank you for using Sharkbucks! Your payment is complete.</p>
                        {transactionHash && (
                            <a
                                href={`https://explorer.aptoslabs.com/txn/${transactionHash}/userTxnOverview?network=testnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline block mt-4"
                            >
                                View transaction on Aptos Labs
                            </a>
                        )}
                    </div>
                    <div className="flex justify-end gap-4">
                        <button onClick={onClose} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const SmeListingPage = () => {
        const [loanApplications, setLoanApplications] = useState([]);
        const [finalizedBids, setFinalizedBids] = useState([]);
        const [userId, setUserId] = useState(null);
        const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility
        const [transactionHash, setTransactionHash] = useState(null); // State for transaction hash
        const router = useRouter();

        useEffect(() => {
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    setUserId(user.uid);
                    fetchFinalizedBids(user.uid);
                    fetchLoanApplications();
                } else {
                    router.push("/login");
                }
            });
        }, []);

        const handleFund = async (applicationId, amount) => {
            try {
                // Start the funding process
                const transactionHash = await fundStartup(applicationId, amount * 10);
                setTransactionHash(transactionHash);
                setIsModalOpen(true);
                toast.success("Startup funded successfully!");
        
                // Fetch all bids from Firestore
                const bidsSnapshot = await getDocs(collection(db, "bids"));
                const bids = bidsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
        
                // Find the bid that matches the applicationId
                const bid = bids.find(bid => bid.applicationId === applicationId);
        
                if (bid) {
                    // Update the fundingReceived in the bid document
                    const docRef = doc(db, "bids", bid.id);
                    const currentData = bid;
                    const newFundingReceived = (parseFloat(currentData.fundingReceived) || 0) + amount;
        
                    console.log(`Updating bid fundingReceived from ${currentData.fundingReceived} to ${newFundingReceived}`);
        
                    // Perform the update
                    await updateDoc(docRef, { fundingReceived: newFundingReceived });
        
                    // Log the updated values to ensure correct calculations
                    console.log(`Current Funding Received: ${newFundingReceived}, Loan Amount: ${bid.loanAmount}`);
                    
                    // Add a quick check for the 'Completed' status before updating
                    if (newFundingReceived >= bid.loanAmount) {
                        if (bid.status !== "Completed") {
                            console.log("Updating status to 'Completed'");
                            await updateDoc(docRef, { status: "Completed" });
                            toast.success("Bid status updated to 'Completed'!");
                        } else {
                            console.log("Bid already marked as 'Completed'.");
                        }
                    }
        
                    // Update loan application
                    const applicationRef = doc(db, "applications", applicationId);
                    const applicationSnapshot = await getDoc(applicationRef);
        
                    if (applicationSnapshot.exists()) {
                        const applicationData = applicationSnapshot.data();
                        const newLoanAmount = applicationData.loanAmount - amount;
        
                        await updateDoc(applicationRef, { loanAmount: newLoanAmount });
                        fetchLoanApplications();
                    } else {
                        console.error("Application document not found!");
                        toast.error("Application not found in database");
                    }
                } else {
                    console.error("Bid document not found!");
                    toast.error("Bid not found in database");
                }
        
                // Fetch finalized bids again
                fetchFinalizedBids(userId);
            } catch (error) {
                console.error("Error funding the startup:", error);
                toast.error("Failed to fund startup");
            }
        };
        
        
        
            

        const fetchLoanApplications = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "applications"));
                const applicationsData = querySnapshot.docs.map(doc => doc.data());
                const filteredApplications = applicationsData.filter(application =>
                    application.fundingStatus !== 'finalized'
                );
                setLoanApplications(filteredApplications);
                toast.success('Loan applications fetched successfully');
            } catch (error) {
                console.error('Error fetching loan applications:', error);
                toast.error('Error fetching loan applications');
            }
        };

        const fetchFinalizedBids = async (userId) => {
            try {
                const querySnapshot = await getDocs(collection(db, "bids"));
                const applicationsData = querySnapshot.docs.map(doc => ({
                    id: doc.id, 
                    ...doc.data(),
                }));
        
                const filteredApplications = applicationsData.filter(application =>
                    application.status === 'finalized' && application.userId === userId
                );
        
                setFinalizedBids(filteredApplications);
                toast.success('Finalized bids fetched successfully');
            } catch (error) {
                console.error('Error fetching finalized bids:', error);
                toast.error('Error fetching finalized bids');
            }
        };
        
        const handleViewApp = (applicationId) => {
            router.push("/viewapplication/?id=" + applicationId);
        };

    return (
        <div className="page">
            <div className="flex justify-between items-center mt-[100px] mb-0 w-full">
                <button 
                    className="pref border border-amber-500 p-4"
                    onClick={() => router.push("/mybids")}
                >
                    View My Bids
                </button>
                <h1 className="section-title text-center text-4xl">Investor Dashboard</h1>
                <button
                    className="pref border border-amber-500 p-4"
                    onClick={() => router.push("/investorport")}
                >
                    View Personalised Preferences
                </button>
            </div>
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)} // Close modal on button click
                transactionHash={transactionHash}
            />
        return (
            <div className="page">
                <div className="flex justify-between items-center mt-[100px] mb-0 w-full">
                    <h1 className="section-title text-center text-4xl">Investor Dashboard</h1>
                    <button
                        className="pref border border-amber-500 p-4"
                        onClick={() => router.push("/investorport")}
                    >
                        View Personalised Preferences
                    </button>
                </div>
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)} // Close modal on button click
                    transactionHash={transactionHash}
                />

                <div className="investor-dashboard">
                    {/* Active Loan Applications Section */}
                    <div className="loan-applications">
                        <h2 className="section-subtitle">SMEs looking for funding</h2>
                        <div className="applications-list">
                            {loanApplications.length === 0 ? (
                                <p className="no-applications">No Loan Applications Found</p>
                            ) : (
                                loanApplications.map((application) => (
                                    <div key={application.id} className="application-card">
                                        <h3 className="company-name">{application.companyName}</h3>
                                        <p className="loan-details">Amount: {application.loanAmount}</p>
                                        <p className="loan-details">Status: {application.fundingStatus}</p>
                                        <p className="loan-details">Funding Received: {application.fundingReceived}</p>
                                        <div className="button-group">
                                            <button
                                                className="view-button"
                                                onClick={() => handleViewApp(application.id)}
                                            >
                                                View Application
                                            </button>
                                            <button
                                                className="bid-button"
                                                onClick={() => router.push("/bidding/?id=" + application.id)}
                                            >
                                                Bid
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Finalized Bids Section */}
                    <div className="finalized-bids">
                        <h2 className="section-subtitle">Your Finalized Bids</h2>
                        <div className="applications-list">
                            {finalizedBids.length === 0 ? (
                                <p className="no-applications">No Finalized Bids Found</p>
                            ) : (
                                finalizedBids.map((application) => (
                                    <div key={application.id} className="application-card">
                                        <h3 className="company-name">{application.companyName}</h3>
                                        <p className="loan-details">Amount: {application.loanAmount}</p>
                                        <p className="loan-details">Status: {application.status}</p>
                                        <p className="loan-details">Funding Received: {application.fundingReceived}</p>
                                        <div className="button-group">
                                            <button
                                                className="view-button"
                                                onClick={() => router.push("/viewapplication/?id=" + application.id)}
                                            >
                                                View Application
                                            </button>
                                            <button
                                                className="bid-button"
                                                onClick={() => handleFund(application.applicationId, application.loanAmount)}
                                            >
                                                Finalize Payment
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chatbot Section */}
                    <div>
                        <h1 className="section-subtitle">Ask our chatbot about the latest trends to invest on!</h1>
                        <div className="chatbot">
                            <Chatbot />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    export default SmeListingPage;
