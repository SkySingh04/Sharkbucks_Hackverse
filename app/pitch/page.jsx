'use client'
import React, { useState } from 'react';
import { doc, setDoc } from "firebase/firestore";
import { db } from '../firebase';
import { useEdgeStore } from "../lib/edgestore";
import { useSearchParams, useRouter } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import { Upload, X } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';

const FileUploadComponent = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { edgestore } = useEdgeStore();
  const [progress, setProgress] = useState(0);

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    try {
      const res = await edgestore.publicFiles.upload({
        file,
        onProgressChange: (progress) => setProgress(progress),
      });
      
      if (res.url) {
        onUploadSuccess(res.url);
        toast.success('Video uploaded successfully');
        setFile(null);
        setProgress(0);
      }
    } catch (error) {
      toast.error('Upload failed');
    }
    setUploading(false);
  };

  return (
    <div className=" rounded-lg  shadow-md ">
      <h3 className="text-lg font-semibold mb-4 text-white ">Upload Video Pitch</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer  ">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-300" />
              <p className="mb-2 text-sm text-gray-300">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-400">MP4, WebM or MOV (MAX. 100MB)</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0])}
            />
          </label>
        </div>
        
        {file && (
          <div className="flex items-center justify-between  p-2 rounded">
            <span className="text-sm truncate text-gray-200">{file.name}</span>
            <button
              onClick={() => setFile(null)}
              className="text-red-400 hover:text-red-300"
              
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {progress > 0 && progress < 100 && (
          <div className="w-full  rounded-full h-2.5">
            <div
              className=" h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`w-full px-4 py-2 text-white bg-blue-800 rounded-lg ${
            !file || uploading
              ? ' cursor-not-allowed'
              : ' hover:'
          }`}
        >
          {uploading ? 'Uploading...' : 'Upload Video'}
        </button>
      </div>
    </div>
  );
};

const App = () => {
  const [pitch, setPitch] = useState('');
  const router = useRouter();
  const search = useSearchParams();
  const applicationId = search.get('id');
  const [downloadLink, setDownloadLink] = useState('');
  const [customPreference, setCustomPreference] = useState('');
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [availablePreferences, setAvailablePreferences] = useState([
    'Technology', 'Manufacturing', 'Healthcare', 'Agribusiness',
    'Renewable-Energy', 'Education', 'E-commerce', 'Infrastructure',
    'Financial-Services', 'Consumer-Goods', 'Artisanal-and-Handicrafts',
    'Sustainable-and-Social-Enterprises'
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pitch.trim()) {
      toast.error('Please enter your pitch');
      return;
    }
    if (selectedPreferences.length === 0) {
      toast.error('Please select at least one tag');
      return;
    }
    if (!downloadLink) {
      toast.error('Please upload a video');
      return;
    }

    try {
      const applicationRef = doc(db, "applications", applicationId.toString());
      await setDoc(applicationRef, {
        pitch,
        tags: selectedPreferences,
        videoLink: downloadLink,
      }, { merge: true });
      toast.success('Application submitted successfully');
      router.push('/viewapplication/?id=' + applicationId.toString());
    } catch (e) {
      console.error("Error adding document: ", e);
      toast.error('Error submitting application');
    }
  };

  return (
    <div className="min-h-screen  p-8 mt-4">
      <ToastContainer />
      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div className=" rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-bold mb-4 text-white">Submit Your Pitch</h2>
              <textarea
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                placeholder="Tell us what you need and why!"
                className="w-full h-48 p-4 border rounded-lg  border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <FileUploadComponent onUploadSuccess={setDownloadLink} />
          </div>

          {/* Right Column */}
          <div className=" rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-bold mb-4 text-white">Tags</h2>
            <p className="text-gray-300 mb-4">Select tags that will allow us to identify you better:</p>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {availablePreferences.map(preference => (
                  <button
                    key={preference}
                    type="button"
                    onClick={() => {
                      setSelectedPreferences(prev => [...prev, preference]);
                      setAvailablePreferences(prev => prev.filter(p => p !== preference));
                    }}
                    className="px-3 py-1  hover: rounded-full text-sm flex items-center gap-1 text-gray-200"
                  >
                    {preference}
                    <span className="text-purple-400">+</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPreference}
                  onChange={(e) => setCustomPreference(e.target.value)}
                  placeholder="Enter custom tag"
                  className="flex-1 px-3 py-2 border rounded-lg  border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customPreference.trim()) {
                      setSelectedPreferences(prev => [...prev, customPreference.trim()]);
                      setCustomPreference('');
                    }
                  }}
                  className="px-4 py-2  text-white rounded-lg hover:"
                >
                  Add
                </button>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold mb-2 text-white">Selected Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedPreferences.map((pref, index) => (
                    <div
                      key={index}
                      className="px-3 py-1 /50 rounded-full text-sm flex items-center gap-1 text-purple-100"
                    >
                      {pref}
                      <button
                        type="button"
                        onClick={() => {
                          setAvailablePreferences(prev => [...prev, pref]);
                          setSelectedPreferences(prev => prev.filter(p => p !== pref));
                        }}
                        className="text-red-400 hover:text-red-300"
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
            className="px-8 py-3  text-white rounded-lg hover: font-semibold shadow-lg hover:shadow-xl transition-all bg-blue-800"
          >
            Submit Application
          </button>
        </div>
      </form>
    </div>
  );
};

export default App;