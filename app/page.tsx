'use client';
import React, { useEffect, useState } from 'react';
import { FaHandshake, FaBuilding } from 'react-icons/fa';
import Link from 'next/link';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import styles from './Home.module.css';
import { useRouter } from 'next/navigation';


export default function Home() {
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [finalizedBid, setFinalizedBid] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoggedInUser(user);

        // Check if the user has a finalized bid
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().finalizedBid?.finalized) {
          setFinalizedBid(userSnap.data().finalizedBid);
          setShowDialog(true);
        }
      } else {
        setLoggedInUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleFinalize = () => {
    // Handle the logic for finalizing the bid (e.g., updating Firestore or redirecting to another page)
    setShowDialog(false);
    router.push("/investor")
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="flex justify-space-between">
        <div>
          <h1 className="text-4xl font-bold text-center mt-[60px] ">#EveryoneIsASHARK</h1>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center mt-8 md:space-x-[100px]">
        <Link href={{ pathname: '/login', query: { userType: 'investor' } }}>
          <div
            className={`card bg-gray-900 mx-6 investors-card items-center justify-center lg:h-[300px] lg:w-[500px] text-white font-semibold px-6 py-4 rounded-md cursor-pointer transition-transform  duration-300 ${styles.hoverEffect}`}
          >
            <FaHandshake className="text-4xl mx-auto mb-4" />
            <h1 className="text-2xl mx-auto text-center mb-2">Investor Dashboard</h1>
            <h1 className="mx-auto text-center ">Find your next investment!</h1>
          </div>
        </Link>

        <Link href={{ pathname: '/login', query: { userType: 'sme' } }}>
          <div
            className={`card bg-gray-900 mx-6 smes-card items-center justify-center lg:h-[300px] lg:w-[500px]  text-white font-semibold px-6 py-4 rounded-md cursor-pointer transition-transform duration-300 ${styles.hoverEffect}`}
          >
            <FaBuilding className="text-4xl mx-auto mb-4 " />
            <h1 className="text-2xl mb-2 mx-auto text-center">SME's Dashboard</h1>
            <h1 className="mx-auto text-center">Find Investors right away!</h1>
          </div>
        </Link>
        <h2 className="text-4xl font-bold text-center mt-[60px] ">
          Support <span className="text-4xl" style={{ color: '#FF9933' }}>#M</span>
          <span className="text-4xl" style={{ color: '#FFFFFF' }}>a</span>
          <span className="text-4xl" style={{ color: '#138808' }}>k</span>
          <span className="text-4xl" style={{ color: '#FF9933' }}>e</span>
          <span className="text-4xl" style={{ color: '#FFFFFF' }}>I</span>
          <span className="text-4xl" style={{ color: '#138808' }}>n</span>
          <span className="text-4xl" style={{ color: '#FF9933' }}>I</span>
          <span className="text-4xl" style={{ color: '#FFFFFF' }}>n</span>
          <span className="text-4xl" style={{ color: '#138808' }}>d</span>
          <span className="text-4xl" style={{ color: '#FF9933' }}>i</span>
          <span className="text-4xl" style={{ color: '#FFFFFF' }}>a</span> by Investing today!
        </h2>
      </div>

      {showDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-gray-800 p-8 rounded-md shadow-md text-white">
            <h2 className="text-xl font-bold mb-4">Finalize Your Bid</h2>
            <p className="mb-4">
              You have a finalized bid for application ID: <strong>{finalizedBid?.applicationId}</strong>.
              Would you like to proceed?
            </p>
            <p className="mb-4 text-red-600">
              Warning: You must complete the payment within 7 days or your account will be banned.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleFinalize}
                className="px-4 py-2 bg-blue-500 text-white rounded-md"
              >
                Finalize
              </button>
              <button
                onClick={handleCloseDialog}
                className="px-4 py-2 bg-gray-500 text-white rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
