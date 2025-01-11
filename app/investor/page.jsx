'use client'
import { collection, getDocs } from "firebase/firestore";
import { useState, useEffect } from "react";
import { db, auth } from '../firebase';
import Chatbot from '../components/Chatbot';
import './page.css';
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { fundStartup } from "../utils/contracts";

const SmeListingPage = () => {
    const [loanApplications, setLoanApplications] = useState([]);
    const [finalizedBids, setFinalizedBids] = useState([]);
    const [userId, setUserId] = useState(null);
    const router = useRouter();

    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            console.log('User:', user);
            if (user) {
                setUserId(user.uid);
                fetchFinalizedBids(user.uid);
                fetchLoanApplications();
            } else {
                router.push("/login");
            }
        });
    }, []);

    const handleFund = async (startupId, amount) => {
        try {
            await fundStartup(startupId, amount);
            toast.success("Startup funded successfully!");
        } catch (error) {
            console.error(error);
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
            const applicationsData = querySnapshot.docs.map(doc => doc.data());
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
            
            <div className="investor-dashboard">
                {/* Active Loan Applications Section */}
                <div className="loan-applications ">
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
                                    <p className="loan-details">Amount: {application.loanAmount} APT : ₹{application.loanAmountInINR || (application.loanAmount * 777.36)}</p>
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
                                            onClick={() => handleFund(application.applicationId, application.loanAmount )} 
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
}

export default SmeListingPage;