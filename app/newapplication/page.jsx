'use client'
import React, { useEffect, useState } from 'react';
import {useRouter} from 'next/navigation'
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore"; 
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createStartup } from "../utils/contracts";

const LoanApplicationForm = () => {
  const [loggedInUser, setLoggedInUser] = useState("");
  const [goal, setGoal] = useState(0);
  const router = useRouter();

  const handleCreate = async () => {
    try {
      await createStartup(goal);
      toast.success("Startup created successfully on blockchain!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create startup on blockchain");
    }
  };

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const randomID = () => {
    return Math.floor(Math.random() * 1000000000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const applicationId = randomID();
    try {
      const applicationData = {
        userId: loggedInUser,
        applicationId,
        companyName: formData.companyName,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        businessType: formData.businessType,
        yearsInOperation: formData.yearsInOperation,
        annualRevenue: formData.annualRevenue,
        loanAmount: formData.loanAmount,
        loanPurpose: formData.loanPurpose,
        fundingReceived: 0,
        fundingStatus: "pending",
      };
      const applicationRef = doc(db, "applications", applicationId.toString());
      await setDoc(applicationRef, applicationData);
      await setDoc(applicationRef, { id: applicationId, userId: loggedInUser }, { merge: true });
      setGoal(parseInt(formData.loanAmount));
      try {
        await handleCreate();
      } catch (error) {
        console.error("Error creating startup: ", error);
        return;
      }
      toast.success('Application submitted successfully');
      router.push("/upload?userId=" + loggedInUser + "&id=" + applicationId);
    } catch (error) {
      toast.error('Error submitting application');
      console.error("Error adding/updating document: ", error);
    }
  };

  return (
    <div className="mt-[6em] ml-4 w-1/2 h-[90vh]">
      <ToastContainer />
      <h2 className="text-xl font-bold mb-4 mt-12">Loan Application Form</h2>
      <form>
        {/* Row 1 */}
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
        {/* Row 2 */}
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
        {/* Row 3 */}
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
        {/* Row 4 */}
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
                placeholder="Goal (ETH)"
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
        {/* Terms and submit button inline */}
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
              onClick={handleSubmit}
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!formData.agreeTerms}
            >
              Upload Documents
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoanApplicationForm;