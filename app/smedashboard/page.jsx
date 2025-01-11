'use client'
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './page.css'; 
import Chatbot from '../components/Chatbot';

const DashboardPage = () => {
    const router = useRouter();
    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log('User is signed in with UID:', user.uid);
                setLoggedInUser(user.uid);
            } else {
                router.push(`/`);
            }
        })
    }, []);

    const handleViewApp = ({ applicationId }) => {
        router.push(`/viewapplication?id=${applicationId}`);
    }

    const [loanApplications, setLoanApplications] = useState([]);
    const [loggedInUser, setLoggedInUser] = useState('');

    useEffect(() => {
        fetchLoanApplications();
    }, [loggedInUser]);

    const fetchLoanApplications = async () => {
        try {
            console.log('Fetching loan applications for user:', loggedInUser);
            const docRef = getDocs(collection(db, "applications"));
            if (docRef) {
                const applications = [];
                (await docRef).forEach((doc) => {
                    if (doc.data().userId === loggedInUser) {
                        applications.push(doc.data());
                    }
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

    const createNewApplication = async () => {
        router.push('/newapplication');
    };

    const handleClick = ({ applicationId }) => {
        router.push(`/bidslist?id=${applicationId}`);
    };

    return (
        <div className='h-screen flex flex-col space-y-10 '>
           <div className="flex justify-between items-center mt-[100px] mb-0 w-full px-4">
                <h1 className="section-title text-4xl">SME Dashboard</h1>
                <button 
                    className="pref border border-amber-500 p-4"
                    onClick={createNewApplication}>Create New Application
                </button>
            </div>
            <ToastContainer />
            <div className='dashboard-container'>
                <div className='left-side'>
                    <h2 className="section-subtitle">Existing Loan Applications</h2>
                    <ul className="applications-list">
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
                                    )}
                                    <div className='buttons'>
                                        <button className='view-button' onClick={() => { handleViewApp({ applicationId: application.id }) }}>
                                            View Application
                                        </button>
                                        {application.fundingStatus !== 'finalized' && (
                                            <button className='view-bid' onClick={() => { handleClick({ applicationId: application.id }) }}>
                                                View Bids
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </ul>
                </div>
                <div className='right-side'>
                    <h1>Want to know about the latest government schemes for your SME? Ask our Chatbot!</h1>
                    <Chatbot />
                </div>
                <div className='right-side'></div>
            </div>
        </div>
    );
};

export default DashboardPage;