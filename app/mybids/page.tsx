'use client';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const MyComponent = () => {
    const [filteredBids, setFilteredBids] = useState<any[]>([]);
    const [names, setNames] = useState<{ [key: string]: string }>({});
    const [showModal, setShowModal] = useState(false);
    const [selectedBid, setSelectedBid] = useState<any>(null);
    const [applicationDetails, setApplicationDetails] = useState<any>(null);
    const [uid, setUid] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUid(user.uid);
            } else {
                router.push('/login'); // Redirect to login if not authenticated
            }
        });

        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        const fetchFilteredBids = async () => {
            if (!uid) return;

            try {
                const q = query(collection(db, 'bids'), where('userId', '==', uid));
                const querySnapshot = await getDocs(q);

                const filteredBidsData: any[] = [];
                querySnapshot.forEach(async (document) => {
                    const bid = document.data();
                    filteredBidsData.push(bid);
                    const usersRef = doc(db, 'users', bid.userId.toString());
                    const userSnap = await getDoc(usersRef);
                    if (userSnap.exists()) {
                        setNames(prevNames => ({ ...prevNames, [bid.userId]: userSnap.data().displayName }));
                    }
                });
                setFilteredBids(filteredBidsData);
            } catch (error) {
                console.error('Error fetching filtered bids:', error);
            }
        };
        fetchFilteredBids();
    }, [uid]);

    const openModal = async (bid: any) => {
        setSelectedBid(bid);
        try {
            const applicationRef = doc(db, 'applications', bid.applicationId);
            const applicationSnap = await getDoc(applicationRef);
            if (applicationSnap.exists()) {
                setApplicationDetails(applicationSnap.data());
            }
        } catch (error) {
            console.error('Error fetching application details:', error);
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setApplicationDetails(null);
    };

    return (
        <div className='h-screen'>
            <h2 className="text-xl font-bold mb-4 mt-[100px]">My Bids</h2>
            {filteredBids.length === 0 ? (
                <p className='text-center text-4xl'>No bids yet :/</p>
            ) : (
                <div className="grid grid-cols-3 gap-4">
                    {filteredBids.map((bid: any) => (
                        <div key={bid.bidId} className="bg-gray-800 text-white rounded-md p-4">
                            <p>Name: {names[bid.userId] || "Unknown"}</p>
                            <p>Rate of Interest: {bid.interestRate}</p>
                            <p>Tenure: {bid.tenure}</p>
                            <button
                                onClick={() => openModal(bid)}
                                className="mt-2 px-4 py-2 rounded-md bg-blue-500 text-white"
                            >
                                View Application
                            </button>
                        </div>
                    ))}
                </div>
            )}
            {showModal && applicationDetails && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-black p-8 rounded-md">
                        <h3 className="text-xl font-bold mb-4">Application Details</h3>
                        <p>Application ID: {selectedBid.applicationId}</p>
                        <p>Funding Status: {applicationDetails.fundingStatus}</p>
                        <p>Other Details: {applicationDetails.otherDetails}</p> {/* Add other relevant details */}
                        <div className="mt-4 flex justify-between">
                            <button onClick={closeModal} className="px-4 py-2 bg-gray-500 text-white rounded-md">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyComponent;
