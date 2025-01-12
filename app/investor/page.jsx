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
    const [loggedInUser, setLoggedInUser] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility
    const [transactionHash, setTransactionHash] = useState(null); // State for transaction hash
    const router = useRouter();

    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
                // console.log('User is signed in with UID:', user.uid);
                // setLoggedInUser(user.uid);
                fetchFinalizedBids(user.uid);
                fetchLoanApplications(user.uid);
            } else {
                router.push("/login");
            }
        });
    }, [router]);

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
    
                // Check if fundingReceived equals loanAmount
                if (newFundingReceived === parseFloat(bid.loanAmount)) {
                    console.log("Funding received equals loan amount. Updating status to 'completed'");
                    await updateDoc(docRef, { status: "completed" });
                    toast.success("Bid fully funded and marked as completed!");
                } else if (newFundingReceived > parseFloat(bid.loanAmount)) {
                    console.log("Warning: Funding received exceeds loan amount");
                    await updateDoc(docRef, { status: "completed" });
                    toast.warning("Funding exceeds requested amount. Bid marked as completed.");
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

     const fetchLoanApplications = async (loggedInUser) => {
            try {
                console.log('Fetching loan applications for user:', loggedInUser);
                const docRef = getDocs(collection(db, "applications"));
                if (docRef) {
                    const applications = [];
                    (await docRef).forEach((doc) => {
                            applications.push(doc.data());
                    });
                    
                    // Sort applications - special ones first
                    const sortedApplications = applications.sort((a, b) => {
                        if (a.isSpecial === b.isSpecial) return 0;
                        return a.isSpecial ? -1 : 1;
                    });
                    
                    console.log("Applications found for user:", loggedInUser, sortedApplications);
                    toast.success("Applications found!");
                    setLoanApplications(sortedApplications);
                } else {
                    console.log("No applications found for user:", loggedInUser);
                    toast.warn("No applications found!");
                    setLoanApplications([]);
                }
            } catch (error) {
                toast.error("Error fetching loan applications!");
                console.error('Error fetching loan applications:', error);
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

            {/* Modal for payment success */}
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
                            <li className="no-applications">No Loan Applications Found</li>
                        ) : (
                            loanApplications.map((application) => (
                                <div 
                                    key={application.id} 
                                    className={`application-card ${application.isSpecial ? 'special-border' : ''} ${application.fundingStatus === 'finalized' ? 'bg-green-800' : ''}`}
                                    title={application.isSpecial ? 'No transaction fees for this application!' : ''}
                                >
                                    <div className="relative group">
                                        <h3 className='company-name'>
                                            {application.companyName}
                                            {application.isSpecial && (
                                                <span className="ml-2">🌱</span>
                                            )}
                                        </h3>
                                        {application.isSpecial && (
                                            <div className="absolute invisible group-hover:visible bg-green-100 text-green-800 p-2 rounded-md shadow-lg z-10 w-48 text-sm">
                                                No transaction fees for this application!
                                            </div>
                                        )}
                                    </div>
                                    <p className='loan-details'>Amount: {application.loanAmount} APT (₹{application.loanAmountInINR || (application.loanAmount * 777.36)})</p>
                                    <p className='loan-details'>Status: {application.fundingStatus}</p>
                                    {application.isSpecial && (
                                        <p className='special-note'>🌱 This application fuels the eco dream!</p>
                                    )}<div className="button-group">
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
                                    <button
                                        className="fund-button"
                                        onClick={() => handleFund(application.applicationId, application.loanAmount)}
                                    >
                                        Fund Startup
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chatbot Component */}
                <Chatbot />
            </div>

            <ToastContainer />
        </div>
    );
};

export default SmeListingPage;
