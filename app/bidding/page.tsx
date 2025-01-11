'use client'
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc , updateDoc , addDoc , collection} from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
// import toast from 'react-hot-toast';
import { ToastContainer, toast } from 'react-toastify';
  import 'react-toastify/dist/ReactToastify.css';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
    

const LoanForm = () => {
    const [loanAmount, setLoanAmount] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [tenure, setTenure] = useState('');
    const [additionalDetails, setAdditionalDetails] = useState('');
    const [visibleButtons, setVisibleButtons] = useState(false);
    const [isFirstTime, setIsFirstTime] = useState(true);
    const [userId, setUserId] = useState<any>(null);
    const router = useRouter();
    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log(user.uid);
                setUserId(user.uid);
                fetchUserDetails(user.uid);
            }
            else{
                router.push("/login")
            }
        }
        );
    }, [userId]);
    const fetchUserDetails = async (userId: string) => {
        console.log(userId);
        const usersRef = doc(db, 'users', userId);
    const userSnap = await getDoc(usersRef);
    if (userSnap.exists()) {
        console.log('User data:', userSnap.data());
        console.log('FROM DB First time:', userSnap.data().isFirstTime);
        if (userSnap.data().isFirstTime) {
            setIsFirstTime(userSnap.data().isFirstTime); // Update isFirstTime state
        }
    } else {
        setIsFirstTime(false);
    }
}
    const handleSubmit = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        // Process form submission, e.g., send data to backend
        console.log({
            loanAmount,
            interestRate,
            tenure,
            additionalDetails
        });
        // Reset form fields
        setLoanAmount('');
        setInterestRate('');
        setTenure('');
        setAdditionalDetails('');
        console.log("Calling handle bid place")
        console.log("PLacing bidd")
            try{
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
                router.push("/")
            }
            catch(error){
                console.log("Error occured " ,  error)
                toast.error("Failed to Place Bid")
            }
        
    };

    const search = useSearchParams();
    const applicationId = search.get('id');
    //const applicationId = "822179335";
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
        <div className="flex justify-center w-[100%]  gap-10 mt-10 h-[700px]">
            {/* SME Details */}
            <ToastContainer />
            <div className="w-1/3 mt-20 ml-10  bg-gray-900 text-white p-6 rounded-md shadow-md h-[600px]">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">SME Details</h2>
                <div className=" mx-auto mt-16 flex justify-center w-full">
            {application && (
                <div className=" shadow-md   rounded-lg p-8">
                    <h1 className="text-2xl font-bold mb-4">{application.companyName}</h1>
                    <br></br>
                    <p className='text-xl'><strong>Loan Purpose:</strong> {application.loanPurpose}</p>
                    <p className='text-xl'><strong>Pitch:</strong> {application.pitch}</p>
                    <p className='text-xl'><strong>Loan Amount:</strong> {application.loanAmount}</p>
                    <p className='text-xl'><strong>Amout Received:</strong> {application.loanAmount}</p>
                    <p className='text-xl'><strong>Amount Left:</strong> {application.loanAmount - application.loanAmount}</p>
                </div>
            )}
        </div>
                </div>
        <div className="w-1/3  mt-20 bg-gray-900 text-white p-6 rounded-md shadow-md h-[500px] ">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 ">Loan Details</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700">Loan Amount</label>
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
                <br></br>
                <div className="mb-4">
                    <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700">Interest Rate (%)</label>
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
                <br></br>
                <div className="mb-4">
                    <label htmlFor="tenure" className="block text-sm font-medium text-gray-700">Tenure (in months)</label>
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
                <br></br>
                <div className="mb-4">
                    <label htmlFor="additionalDetails" className="block text-sm font-medium text-gray-700">Additional Details</label>
                    <input
                        id="additionalDetails"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-400 focus:ring-opacity-50"
                        placeholder="Provide additional details"
                        value={additionalDetails}
                        onChange={(e) => setAdditionalDetails(e.target.value)}
                    />
                </div>
                <br></br>
                <button
                    type="submit"
                    className="bg-green-500 text-white font-semibold py-2 px-4 rounded hover:bg-blue-600 transition duration-300"
                    // onClick={handleBidPlace}
                >
                    Make a Bid
                </button>
            </form>
        </div>
        </div>
        
    );
};

export default LoanForm;
