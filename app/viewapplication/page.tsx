"use client";

import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import "./page.css";

interface Application {
  id: string;
  companyName: string;
  businessType: string;
  tags: Array<string | { tag: string; isSpecial: boolean }>;
  loanPurpose: string;
  yearsInOperation: number;
  annualRevenue: number;
  phone: string;
  fundingStatus: string;
  fundingReceived: string;
  loanAmount: number;
  loanAmountInINr : number;
  pitch: string;
  videoLink: string;
}

const ViewApplicationPage = () => {
  const search = useSearchParams();
  const router = useRouter();
  const applicationId = search.get("id");
  const [application, setApplication] = useState<Application | null>(null);

  useEffect(() => {
    const fetchApplication = async () => {
      if (!applicationId) return;

      try {
        const appRef = doc(db, "applications", applicationId);
        const appSnap = await getDoc(appRef);

        if (appSnap.exists()) {
          const appData = appSnap.data() as Application;
          appData.loanAmountInINr = appData.loanAmount * 777.36;          ;
          setApplication(appData);
          toast.success('Application found!');
        } else {
          toast.error("Application not found!");
        }
      } catch (error) {
        console.error("Error fetching application:", error);
        toast.error("Error fetching application!");
      }
    };

    fetchApplication();
  }, [applicationId]);

  const handleBidClick = () => {
    router.push(`/bidding/?id=${application?.id}`);
  };

  const hasSpecialTag = application?.tags?.some(
    (tag) => typeof tag === "object" && tag.isSpecial
  );

  return (
    <div
      className="view-application-container"
      style={{
        padding: "20px",
        marginTop: "20px",
        backgroundColor: "#121212",
        color: "#ffffff",
      }}
    >
      {application ? (
        <div
          className="application-details"
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            background: "#1e1e1e",
            padding: "30px",
            borderRadius: "10px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            marginTop: "40px",
          }}
        >
          <h1
            className="application-title"
            style={{
              fontSize: "28px",
              marginBottom: "10px",
              textAlign: "center",
              color: "#90caf9",
            }}
          >
            {application.companyName}
          </h1>

          {hasSpecialTag && (
            <div
              className="eco-popup"
              style={{
                marginBottom: "20px",
                padding: "10px",
                backgroundColor: "#2a2a2a",
                border: "1px solid #4caf50",
                color: "#4caf50",
                textAlign: "center",
                borderRadius: "5px",
                fontWeight: "bold",
              }}
            >
              🌱 This application fuels the eco dream!
            </div>
          )}

          <div
            className="details-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginBottom: "20px",
              color: "#e0e0e0",
              rowGap: "10px",
            }}
          >
            <p><strong>Business Type:</strong> {application.businessType}</p>
            <p>
              <strong>Tags:</strong>{" "}
              {application?.tags
                ?.map((tag) => {
                  if (typeof tag === "object") {
                    const tagName = tag.tag || "Unknown Tag";
                    const isSpecial = tag.isSpecial;
                    return (
                      <span
                        key={tagName}
                        style={{
                          color: isSpecial ? "green" : "inherit", // Highlight special tags in green
                          fontWeight: isSpecial ? "bold" : "normal",
                        }}
                      >
                        {tagName}
                      </span>
                    );
                  }
                  return <span key={tag}>{tag}</span>;
                })
                .reduce<React.ReactNode[]>((acc, curr, idx) => [
                  ...acc,
                  idx > 0 ? ", " : null,
                  curr,
                ].filter(Boolean), [])}
            </p>
            <p><strong>Loan Purpose:</strong> {application.loanPurpose}</p>
            <p><strong>Years in Operation:</strong> {application.yearsInOperation}</p>
            <p><strong>Annual Revenue:</strong> {application.annualRevenue}</p>
            <p><strong>Phone:</strong> {application.phone}</p>
            <p><strong>Funding Status:</strong> {application.fundingStatus}</p>
            <p><strong>Funding Received:</strong> {application.fundingReceived}</p>
            <p><strong>Loan Amount:</strong> {application.loanAmount}</p>
            <p><strong>Loan Amount in INR:</strong> ₹{application.loanAmountInINr}</p>
          </div>

          <div
            className="pitch-box"
            style={{
              marginBottom: "20px",
              color: "#e0e0e0",
              border: "1px solid #333",
              padding: "15px",
              borderRadius: "8px",
              background: "#2a2a2a",
            }}
          >
            <p><strong>Pitch:</strong> {application.pitch}</p>
          </div>

          <div
            className="videolink"
            style={{
              marginBottom: "20px",
              padding: "15px",
              borderRadius: "8px",
              background: "#2a2a2a",
              border: "1px solid #333",
            }}
          >
            <p><strong>Pitch Video:</strong></p>
            <iframe
              width="100%"
              height="315"
              src={application.videoLink}
              title="Pitch Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ borderRadius: '8px' }}
            ></iframe>
          </div>

          <button
            onClick={handleBidClick}
            type="button"
            className="bg-green-500 text-white font-semibold py-2 px-4 rounded hover:bg-blue-600 transition duration-300"
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "16px",
              backgroundColor: "#64b5f6",
              color: "#000000",
              borderRadius: "8px",
              marginTop: "15px",
            }}
          >
            Click to Bid
          </button>
        </div>
      ) : (
        <p
          style={{
            textAlign: "center",
            fontSize: "18px",
            color: "#e0e0e0",
          }}
        >
          Loading application details...
        </p>
      )}
    </div>
  );
};

export default ViewApplicationPage;
