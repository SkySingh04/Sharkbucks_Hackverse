'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';

const InvestorDetailsForm = () => {
  const [investorInfo, setInvestorInfo] = useState({
    amountToInvest: '',
    investmentDuration: '',
    goals: '',
  });
  const [userId, setUserId] = useState(null);
  const router = useRouter();
  const [availablePreferences, setAvailablePreferences] = useState([
    'Technology', 'Manufacturing', 'Healthcare', 'Agribusiness',
    'Renewable-Energy', 'Education', 'E-commerce', 'Infrastructure',
    'Financial-Services', 'Consumer-Goods', 'Artisanal-and-Handicrafts',
    'Sustainable-and-Social-Enterprises'
  ]);
  const [selectedPreferences, setSelectedPreferences] = useState([]);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else router.push("/login");
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const preferencesId = Math.floor(Math.random() * 1000000000);
    try {
      const preferenceData = {
        preferencesId,
        ...investorInfo,
        preferences: selectedPreferences
      };
      await setDoc(doc(db, "preferences", preferencesId.toString()), preferenceData);
      router.push("/investorpreference/?id=" + preferencesId);
    } catch (e) {
      console.error("Error adding/updating document: ", e);
    }
  };

  return (
    <div className="min-h-screen p-8 mt-5">
      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center mb-8">Investor Details Form</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Investment Details */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-semibold text-white mb-6">Investment Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Amount to Invest</label>
                <input
                  type="number"
                  name="amountToInvest"
                  value={investorInfo.amountToInvest}
                  onChange={(e) => setInvestorInfo(prev => ({...prev, [e.target.name]: e.target.value}))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-600 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Investment Duration</label>
                <input
                  type="text"
                  name="investmentDuration"
                  value={investorInfo.investmentDuration}
                  onChange={(e) => setInvestorInfo(prev => ({...prev, [e.target.name]: e.target.value}))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-600 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., 2 years"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Goals and Objectives</label>
                <textarea
                  name="goals"
                  value={investorInfo.goals}
                  onChange={(e) => setInvestorInfo(prev => ({...prev, [e.target.name]: e.target.value}))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-600 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent h-32"
                  placeholder="Describe your investment goals"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Preferences */}
          <div className=" bg-gray-800 rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-semibold text-white mb-6">Investment Preferences</h3>

            <div className="space-y-6">
              <div>
                <p className="text-gray-300 mb-4">Available Preferences:</p>
                <div className="flex flex-wrap gap-2">
                  {availablePreferences.map(preference => (
                    <button
                      key={preference}
                      type="button"
                      onClick={() => {
                        setSelectedPreferences(prev => [...prev, preference]);
                        setAvailablePreferences(prev => prev.filter(p => p !== preference));
                      }}
                      className="px-3 py-1 hover:rounded-full text-sm flex items-center gap-1 text-gray-200"
                    >
                      {preference}
                      <span className="text-purple-400">+</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-gray-300 mb-4">Selected Preferences:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPreferences.map((pref, index) => (
                    <div
                      key={index}
                      className="px-3 py-1 50 rounded-full text-sm flex items-center gap-1 text-purple-100"
                    >
                      {pref}
                      <button
                        type="button"
                        onClick={() => {
                          setAvailablePreferences(prev => [...prev, pref]);
                          setSelectedPreferences(prev => prev.filter(p => p !== pref));
                        }}
                        className="text-red-400 hover:text-red-300 ml-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="submit"
            className="px-8 py-3 bg-blue-800 text-white rounded-lg hover:font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Submit Details
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvestorDetailsForm;