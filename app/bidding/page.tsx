'use client';
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const Modal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean; onClose: () => void; onConfirm: () => void }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-900 text-white p-8 rounded-lg max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">Confirm Bid Placement</h2>
                <div className="mb-6">
                    <p className="mb-4">By proceeding, you agree to the following terms:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Your bid will be evaluated by the startup</li>
                        <li>You will receive a notification if your bid is finalized</li>
                        <li>Once finalized, payment must be made within 7 days</li>
                        <li className='text-red-700'>Failure to make payment will result in account suspension</li>
                    </ul>
                    <a href="https://github.com/SkySingh04/Sharkbucks_Hackverse/blob/master/TermsandConditions.md" className="text-blue-500 hover:underline block mt-4">
                        View Full Terms and Conditions
                    </a>
                </div>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-700">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        I Agree
                    </button>
                </div>
            </div>
        </div>
    );
};

const LoanForm = () => {
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [tenure, setTenure] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [userId, setUserId] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const search = useSearchParams();
  const applicationId = search.get('id');
  const [application, setApplication] = useState<any>(null);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        fetchUserDetails(user.uid);
      } else {
        router.push('/login');
      }
    });
  }, [router]);

  const fetchUserDetails = async (userId: string) => {
    const usersRef = doc(db, 'users', userId);
    const userSnap = await getDoc(usersRef);
    if (userSnap.exists()) {
      console.log('User data:', userSnap.data());
    }
  };

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setShowModal(true); // Open the modal
  };

  const handleConfirmedSubmit = async () => {
    try {
      const bidRef = await addDoc(collection(db, 'bids'), {
        userId: userId,
        applicationId: applicationId,
        loanAmount: loanAmount,
        interestRate: interestRate,
        tenure: tenure,
        additionalDetails: additionalDetails,
        status: 'pending',
      });
      console.log('Bid placed with ID:', bidRef.id);
      toast.success('Bid placed!');
      setShowModal(false); // Close the modal
      router.push('/');
    } catch (error) {
      console.error('Error occurred:', error);
      toast.error('Failed to Place Bid');
    }
  };

  useEffect(() => {
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
    <div className="flex justify-center w-[100%] gap-10 mt-10 h-[700px]">
      {/* SME Details */}
      <ToastContainer />
      <div className="w-1/3 mt-20 ml-10 bg-gray-900 text-white p-6 rounded-md shadow-md h-[600px]">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">SME Details</h2>
        <div className="mx-auto mt-16 flex justify-center w-full">
          {application && (
            <div className="shadow-md rounded-lg p-8">
              <h1 className="text-2xl font-bold mb-4">{application.companyName}</h1>
              <p className="text-xl">
                <strong>Loan Purpose:</strong> {application.loanPurpose}
              </p>
              <p className="text-xl">
                <strong>Pitch:</strong> {application.pitch}
              </p>
              <p className="text-xl">
                <strong>Loan Amount:</strong> {application.loanAmount}
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="w-1/3 mt-20 bg-gray-900 text-white p-6 rounded-md shadow-md h-[500px]">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Loan Details</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700">
              Loan Amount
            </label>
            <input
              type="number"
              id="loanAmount"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-400 focus:ring-opacity-50"
              placeholder="Enter loan amount"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700">
              Interest Rate (%)
            </label>
            <input
              type="number"
              id="interestRate"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-400 focus:ring-opacity-50"
              placeholder="Enter interest rate"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="tenure" className="block text-sm font-medium text-gray-700">
              Tenure (in months)
            </label>
            <input
              type="number"
              id="tenure"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-400 focus:ring-opacity-50"
              placeholder="Enter tenure"
              value={tenure}
              onChange={(e) => setTenure(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="additionalDetails" className="block text-sm font-medium text-gray-700">
              Additional Details
            </label>
            <input
              id="additionalDetails"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-400 focus:ring-opacity-50"
              placeholder="Provide additional details"
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="bg-green-500 text-white font-semibold py-2 px-4 rounded hover:bg-blue-600 transition duration-300"
          >
            Make a Bid
          </button>
        </form>
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} onConfirm={handleConfirmedSubmit} />
    </div>
  );
};

export default LoanForm;
