'use client'
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import './page.css';
import { useRouter } from "next/navigation";

const ViewApplicationPage = () => {
    const search = useSearchParams();
    const router = useRouter();
    const applicationId = search.get('id');
    const [application, setApplication] = useState<any>(null);

    useEffect(() => {
        // Fetch application details
        const fetchApplication = async () => {
            if (applicationId) {
                try {
                    const appRef = doc(db, 'applications', applicationId);
                    const appSnap = await getDoc(appRef);
                    if (appSnap.exists()) {
                        setApplication(appSnap.data());
                        toast.success('Application found!');
                    } else {
                        toast.error('Application not found!');
                    }
                } catch (error) {
                    console.error('Error fetching application:', error);
                    toast.error('Error fetching application!');
                }
            }
        };
        fetchApplication();
    }, [applicationId]);

    return (
        <div className="view-application-container">
            {application && (
                <div className="application-details">
                    <h1 className="application-title">{application.companyName}</h1>
                    <div className="details-grid">
                        <p><strong>Business Type:</strong> {application.businessType}</p>
                        <p><strong>Tags:</strong> {application?.tags?.join(', ')}</p>
                        <p><strong>Loan Purpose:</strong> {application.loanPurpose}</p>
                        <p><strong>Years in Operation:</strong> {application.yearsInOperation}</p>
                        <p><strong>Annual Revenue:</strong> {application.annualRevenue}</p>
                        <p><strong>Phone:</strong> {application.phone}</p>
                        <p><strong>Funding Status:</strong> {application.fundingStatus}</p>
                        <p><strong>Funding Received:</strong> {application.fundingReceived}</p>
                        <p><strong>Loan Amount:</strong> {application.loanAmount}</p>
                        
                    </div>
                    <div className='pitch-box'>
                        <p><strong>Pitch:</strong> {application.pitch}</p>
                    </div>
                    <div className='videolink'>
                        <p>
                            <strong>Pitch Video Link:</strong>
                            <a href={application.videoLink} target="_blank" rel="noopener noreferrer" className="video-link">
                                <img src="video-icon.png" alt="Video Icon" className="video-icon" />
                            </a>
                        </p>
                    </div>
                    <button onClick={()=> router.push("/bidding/?id="+application.id)}
                    type="submit"
                    className="bg-green-500 text-white font-semibold py-2 px-4 rounded hover:bg-blue-600 transition duration-300"
                    // onClick={handleBidPlace}
                >
                    Click to Bid
                </button>

                </div>
                
            )}
        </div>
    );
};

export default ViewApplicationPage;
