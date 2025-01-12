'use client'
import React, { useCallback, useEffect, useState } from 'react';
import { doc, setDoc } from "firebase/firestore"; 
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEdgeStore } from "../lib/edgestore";
import { getDocs, collection, updateDoc } from 'firebase/firestore';
import 'react-toastify/dist/ReactToastify.css';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyDocument } from '../utils/verification';
import { getDocument } from "pdfjs-dist";
// import { Upload, CheckCircle, X, Loader2 } from 'lucide-react';

const LoanApplicationForm = () => {
  const [loggedInUser, setLoggedInUser] = useState("");
  const [submittedApplicationId, setSubmmittedApplicationId] = useState(0);
  const [goal, setGoal] = useState(0);
  const search = useSearchParams();
  const router = useRouter();
  // const userId = search.get("userId");
  // const applicationNumber = search.get("id");
  const { edgestore } = useEdgeStore();

  const [files, setFiles] = useState<{
    identityProof: { file: File | null, status: 'idle' | 'validating' | 'success' | 'error', url: string },
    incomeTax: { file: File | null, status: 'idle' | 'validating' | 'success' | 'error', url: string },
    addressProof: { file: File | null, status: 'idle' | 'validating' | 'success' | 'error', url: string },
    bankStatement: { file: File | null, status: 'idle' | 'validating' | 'success' | 'error', url: string }
  }>({
    identityProof: { file: null, status: 'idle', url: '' },
    incomeTax: { file: null, status: 'idle', url: '' },
    addressProof: { file: null, status: 'idle', url: '' },
    bankStatement: { file: null, status: 'idle', url: '' }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApplicationSubmitted, setIsApplicationSubmitted] = useState(false);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoggedInUser(user.uid);
      } else {
        router.push("/login");
      }
    });
  }, []);

  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    businessType: '',
    yearsInOperation: '',
    annualRevenue: '',
    loanAmount: '',
    loanPurpose: '',
    agreeTerms: false,
  });

  const handleChange = (e : any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const randomID = () => {
    return Math.floor(Math.random() * 1000000000);
  };

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    setIsSubmitting(true); 
  
    try {
      const applicationId = randomID();
      setSubmmittedApplicationId(applicationId);
      const applicationData = {
        userId: loggedInUser,
        id : applicationId,
        applicationId,
        ...formData,
        loanAmountInINR: parseInt(formData.loanAmount) * 777.36,
        fundingReceived: 0,
        fundingStatus: "pending",
      };
  
      // Save to Firestore
      const applicationRef = doc(db, "applications", applicationId.toString());
      await setDoc(applicationRef, applicationData);
  
      setGoal(parseInt(formData.loanAmount)); // Set the funding goal
      setIsApplicationSubmitted(true); // Toggle to the next step
      toast.success("Application submitted successfully!");
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit the application. Please try again.");
    } finally {
      setIsSubmitting(false); // Ensure the loader stops
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const validateFile = async (file: File, type: keyof typeof files) => {
    setFiles(prev => ({
      ...prev,
      [type]: { ...prev[type], status: 'validating' as const }
    }));

    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Add file type validation here if needed
    const isValid = file.size <= 5 * 1024 * 1024; // 5MB limit example

    if (!isValid) {
      toast.error(`${type} file is too large. Maximum size is 5MB`);
      setFiles(prev => ({
        ...prev,
        [type]: { ...prev[type], status: 'error' as const }
      }));
      return false;
    }

    return true;
  };

  
  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>, type: keyof typeof files) => {
    e.preventDefault();
    e.stopPropagation();
  
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;
  
    // Check if file is PDF
    // if (droppedFile.type !== 'application/pdf') {
    //   toast.error('Please upload PDF files only');
    //   return;
    // }
  
    setFiles(prev => ({
      ...prev,
      [type]: { ...prev[type], file: droppedFile, status: 'validating' as const }
    }));
  
    const isValid = await validateFile(droppedFile, type);
    if (isValid) {
      try {
        if (!edgestore) {
          toast.error("Edgestore is not available");
          setFiles(prev => ({
            ...prev,
            [type]: { ...prev[type], status: 'error' }
          }));
          return;
        }
  
        // Upload to EdgeStore
        const res = await edgestore.publicFiles.upload({
          file: droppedFile,
          onProgressChange: (progress: any) => {
            console.log(progress);
          },
        });
  
        // Extract text from PDF
        // const extractedText = await extractPDFText(droppedFile);
        // console.log(extractedText);
        
        // Verify the document
        const verificationResult = await verifyDocument(droppedFile, type);
        console.log(verificationResult);

        if (verificationResult.isValid) {
          setFiles(prev => ({
            ...prev,
            [type]: { file: droppedFile, status: 'success', url: res.url }
          }));
          toast.success(`${type} verified and uploaded successfully!`);
        } else {
          setFiles(prev => ({
            ...prev,
            [type]: { ...prev[type], status: 'error' }
          }));
          toast.error(`${type} verification failed: ${verificationResult}`);
        }
      } catch (error) {
        setFiles(prev => ({
          ...prev,
          [type]: { ...prev[type], status: 'error' }
        }));
        toast.error(`Failed to process ${type}`);
      }
    }
  }, [edgestore]);
  
  const handleSubmit = async () => {
    const allFilesUploaded = Object.values(files).every(file => file.status === 'success');
    
    if (!allFilesUploaded) {
      toast.error('Please upload all required documents');
      return;
    }

    setIsSubmitting(true);
    try {
      if (loggedInUser) {
        const applicationRef = getDocs(collection(db, "applications"));
        const urls = Object.values(files).map(file => file.url);
        
        (await applicationRef).forEach(async (doc) => {
          if (doc.data().userId === loggedInUser) {
            await updateDoc(doc.ref, {
              documents: urls,
            });
          }
        });
      }
      console.log("Application number:", submittedApplicationId);
      console.log("User ID:", loggedInUser);
      toast.success("All documents submitted successfully!");
      router.push("/pitch/?id=" + submittedApplicationId+ "&userId=" + loggedInUser);
    } catch (error) {
      toast.error("Error submitting documents!");
    }
    setIsSubmitting(false);
  };

  const UploadBox = ({ type, label }: { type: keyof typeof files, label: string }) => {
    const status = files[type].status;
    const file = files[type].file;

    return (
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">{label}</label>
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, type)}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${status === 'idle' ? 'border-gray-300 hover:border-blue-500' : ''}
            ${status === 'validating' ? 'border-yellow-500' : ''}
            ${status === 'success' ? 'border-green-500' : ''}
            ${status === 'error' ? 'border-red-500' : ''}`}
        >
          {status === 'idle' && (
            <div className="flex flex-col items-center">
              {/* <Upload className="w-8 h-8 text-gray-400 mb-2" /> */}
              <p className="text-sm text-gray-600">Drag and drop your file here, or click to select</p>
            </div>
          )}
          
          {status === 'validating' && (
            <div className="flex flex-col items-center">
              {/* <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mb-2" /> */}
              <p className="text-sm text-yellow-600">Validating file...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center">
              {/* <CheckCircle className="w-8 h-8 text-green-500 mb-2" /> */}
              <p className="text-sm text-green-600">{file?.name}</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex flex-col items-center">
              {/* <X className="w-8 h-8 text-red-500 mb-2" /> */}
              <p className="text-sm text-red-600">Upload failed. Please try again.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex">
      <div className="mt-[6em] ml-4 w-1/2 h-[90vh]">
      <ToastContainer />
      <h2 className="text-xl font-bold mb-4 mt-12">Loan Application Form</h2>
      <form>
        <div className="flex space-x-4 mb-4">
        <div className="w-1/2">
          <label htmlFor="companyName" className="block mb-1">
          Company Name
          <input
            type="text"
            id="companyName"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            className="w-full border rounded px-4 py-2"
          />
          </label>
        </div>
        <div className="w-1/2">
          <label htmlFor="contactPerson" className="block mb-1">
          Owner Name
          <input
            type="text"
            id="contactPerson"
            name="contactPerson"
            value={formData.contactPerson}
            onChange={handleChange}
            className="w-full border rounded px-4 py-2"
          />
          </label>
        </div>
        </div>
        <div className="flex space-x-4 mb-4">
        <div className="w-1/2">
          <label htmlFor="phone" className="block mb-1">
          Contact Number
          <input
            type="text"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full border rounded px-4 py-2"
          />
          </label>
        </div>
        <div className="w-1/2">
          <label htmlFor="businessType" className="block mb-1">
          Business Type
          <input
            type="text"
            id="businessType"
            name="businessType"
            value={formData.businessType}
            onChange={handleChange}
            className="w-full border rounded px-4 py-2"
          />
          </label>
        </div>
        </div>
        <div className="flex space-x-4 mb-4">
        <div className="w-1/2">
          <label htmlFor="yearsInOperation" className="block mb-1">
          Years in Operation
          <input
            type="number"
            id="yearsInOperation"
            name="yearsInOperation"
            value={formData.yearsInOperation}
            onChange={handleChange}
            className="w-full border rounded px-4 py-2"
          />
          </label>
        </div>
        <div className="w-1/2">
          <label htmlFor="annualRevenue" className="block mb-1">
          Annual Revenue
          <input
            type="number"
            id="annualRevenue"
            name="annualRevenue"
            value={formData.annualRevenue}
            onChange={handleChange}
            className="w-full border rounded px-4 py-2"
          />
          </label>
        </div>
        </div>
        <div className="flex space-x-4 mb-4">
        <div className="w-1/2">
          <label htmlFor="loanAmount" className="block mb-1">
          Loan Amount Required
          <input
            type="number"
            id="loanAmount"
            name="loanAmount"
            value={formData.loanAmount}
            onChange={handleChange}
            className="w-full border rounded px-4 py-2"
            placeholder="Goal (APTs)"
          />
          </label>
        </div>
        <div className="w-1/2">
          <label htmlFor="loanPurpose" className="block mb-1">
          Purpose of Loan
          <input
            type="text"
            id="loanPurpose"
            name="loanPurpose"
            value={formData.loanPurpose}
            onChange={handleChange}
            className="w-full border rounded px-4 py-2"
          />
          </label>
        </div>
        </div>
        <div className="mb-4 flex flex-row items-center space-x-4">
        <div className="flex items-center space-x-2 w-1/2">
          <input
          type="checkbox"
          id="agreeTerms"
          name="agreeTerms"
          checked={formData.agreeTerms}
          onChange={handleChange}
          />
          <label htmlFor="agreeTerms" className="text-sm">
          I agree to the terms and conditions
          </label>
        </div>
        <div className="flex items-center space-x-2 w-1/2">
          <button
          onClick={handleApplicationSubmit}
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!formData.agreeTerms}
          >
          Move to Upload Documents
          </button>
        </div>
        </div>
      </form>
      </div>
      {isApplicationSubmitted && (
      <div className="mt-[9em] ml-4 w-1/2 h-[90vh] mb-4 ">
        <h2 className="text-2xl font-bold mb-6">Upload Documents</h2>
        <div className="flex space-x-4 mb-4">
        <div className="w-1/2">
          <UploadBox type="identityProof" label="Identity Proof" />
        </div>
        <div className="w-1/2">
          <UploadBox type="incomeTax" label="Income Tax Returns" />
        </div>
        </div>
        <div className="flex space-x-4 mb-4">
        <div className="w-1/2">
          <UploadBox type="addressProof" label="Address Proof" />
        </div>
        <div className="w-1/2">
          <UploadBox type="bankStatement" label="Bank Statement" />
        </div>
        </div>
        <button
        onClick={handleSubmit}
        disabled={isSubmitting || Object.values(files).some(file => file.status !== 'success')}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center"
        >
        {isSubmitting ? (
          <>Submitting...</>
        ) : (
          'Submit All Documents'
        )}
        </button>
      </div>
      )}
    </div>
  );
};

export default LoanApplicationForm;
