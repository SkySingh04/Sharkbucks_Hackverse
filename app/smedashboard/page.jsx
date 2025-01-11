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
import { BsAlignCenter } from 'react-icons/bs';

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
        // Push to view application page with the application id as a query parameter
        router.push(`/viewapplication?id=${applicationId}`);
    }

    const [loanApplications, setLoanApplications] = useState([]);
    const [loggedInUser, setLoggedInUser] = useState('');

    // Fetch existing loan applications
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
                    console.log(doc.data().userId);
                    if (doc.data().userId === loggedInUser) {
                        applications.push(doc.data());
                    }
                });
                console.log("Applications found for user:", loggedInUser, applications);
                toast.success("Applications found!");
                setLoanApplications(applications);
            }
            // setLoanApplications(docSnap.data());
            else {
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
        // Push to view application page with the application id as a query parameter
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
                                <div key={application.id} className={`application-card ${application.fundingStatus === 'finalized' ? 'bg-green-800' : ''}`}>
                                    <h3 className='company-name'>{application.companyName}</h3>
                                    <p className='loan-details'>Amount: {application.loanAmount}</p>
                                    <p className='loan-details'>Status: {application.fundingStatus}</p>
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

