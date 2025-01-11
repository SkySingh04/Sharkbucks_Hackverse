'use client';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useSearchParams, useRouter } from 'next/navigation';

const MyComponent = () => {
    const [filteredBids, setFilteredBids] = useState<any[]>([]);
    const [names, setNames] = useState<{ [key: string]: string }>({});
    const [showModal, setShowModal] = useState(false);
    const [selectedBid, setSelectedBid] = useState<any>(null);
    const search = useSearchParams();
    const router = useRouter();
    const id = search.get("id");

    useEffect(() => {
        const fetchFilteredBids = async () => {
            try {
                const q = query(collection(db, 'bids'), where('applicationId', '==', id));
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
    }, [id]);

    const openModal = (bid: any) => {
        setSelectedBid(bid);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const handleFinalizeBid = async (bid: any) => {
        try {
            // Finalize bids
            const querySnapshot = await getDocs(collection(db, 'bids'));
            querySnapshot.forEach(async (document) => {
                if (document.data().applicationId === bid.applicationId) {
                    await updateDoc(doc(db, 'bids', document.id), { status: 'finalized' });
                }
            });

            // Update application
            const applicationRef = doc(db, 'applications', bid.applicationId);
            await updateDoc(applicationRef, { fundingStatus: 'finalized' });

            // Update user document with finalizedBid
            const userRef = doc(db, 'users', bid.userId.toString());
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                await updateDoc(userRef, {
                    finalizedBid: {
                        applicationId: bid.applicationId,
                        finalized: true,
                    },
                });
            }

            closeModal();
            router.push('/');
        } catch (error) {
            console.error('Error finalizing bid:', error);
        }
    };

    return (
        <div className='h-screen'>
            <h2 className="text-xl font-bold mb-4 mt-[100px]">Bids Received</h2>
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
                                Finalize Bid
                            </button>
                        </div>
                    ))}
                </div>
            )}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-black p-8 rounded-md">
                        <p>Are you sure you want to finalize this bid?</p>
                        <div className="mt-4 flex justify-between">
                            <button
                                onClick={() => handleFinalizeBid(selectedBid)}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md"
                            >
                                Yes
                            </button>
                            <button onClick={closeModal} className="px-4 py-2 bg-gray-500 text-white rounded-md">
                                No
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyComponent;
