"use client";
import React, { useEffect, useState } from "react";
import SignInForm from "../components/Signin";
import SignUpForm from "../components/Signup";
import ForgotPasswordDialog from "../components/ForgetPassword";
import { getAuth, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { useSearchParams , useRouter } from 'next/navigation'


export default function App() {
    const auth = getAuth();
    const router = useRouter();
    const [selectedType, setSelectedType] = useState<string | null>(null);
    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if(user){
                if (userType === "Innovator!") {
                    router.push(`/smedashboard`);
                }
                else if (userType === "Investor!") {
                    router.push(`/investor`);
                }
                else {
                    router.push(`/`);
                }
            }
        })
    }, [])
    const searchParams = useSearchParams()
 
    let userType = searchParams.get('userType')
    console.log(userType)
    if (userType ==="sme"){
        userType = "Innovator!"
    }
    else if (userType ==="investor"){
        userType = "Investor!"
    }
    else{
        userType = selectedType
    }

  const [type, setType] = useState("signIn");
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [status, setStatus] = useState("");
  const handleOnClick = (text: any) => {
    if (text !== type) {
      setType(text);
      return;
    }
  };

  const handleForgotPasswordClick = () => {
    setForgotPasswordOpen(true);
  };

  const handleCloseForgotPassword = () => {
    setForgotPasswordOpen(false);
  };

  const handleSendEmail = (email: string) => {
    // Implement your logic to send the email here
    // console.log("Sending email to:", email);
    sendPasswordResetEmail(auth, email)
      .then(() => {
        console.log("Email sent successfully");
        setStatus("Email Sent Successfully, Please Check your mail");
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
        setStatus("Error Sending Email ,  Please Check The Email Provided");
      });
    // You can make an API call or trigger the email sending process
  };

  const containerClass =
    "container " + (type === "signUp" ? "right-panel-active" : "");
  return (
    <div className="App loginbody">
      {userType ? (
        <h1 className="text-center text-5xl mt-[120px] mb-5 text-white">
          Welcome Back {userType}
        </h1>
      ) : (
        <div className="text-center mt-[120px] mb-5">
          <h1 className="text-5xl text-white">Choose User Type</h1>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white m-2 font-bold py-2 px-4 rounded"
            onClick={() => setSelectedType("Innovator!")}
          >
            Innovator
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white m-2 font-bold py-2 px-4 rounded"
            onClick={() => setSelectedType("Investor!")}
          >
            Investor
          </button>
        </div>
      )}
      <div className={containerClass} id="container">
        <SignUpForm userType={userType} />
        <SignInForm userType={userType} />
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Welcome Back!</h1>
              <p>To keep connected with us please login with your personal info</p>
              <button
                className="ghost loginbutton"
                id="signIn"
                onClick={() => handleOnClick("signIn")}
              >
                Sign In
              </button>
              <button
                className="ghost loginbutton m-4"
                id="forgotPassword"
                onClick={handleForgotPasswordClick}
              >
                Forgot Password?
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>Hello, Friend!</h1>
              <p>Enter your personal details and start journey with us</p>
              <button
                className="ghost  loginbutton"
                id="signUp"
                onClick={() => handleOnClick("signUp")}
              >
                Sign Up
              </button>
              <button
                className="ghost loginbutton m-4"
                id="forgotPassword"
                onClick={handleForgotPasswordClick}
              >
                Forgot Password?
              </button>
            </div>
          </div>
        </div>
      </div>
      {forgotPasswordOpen && (
        <div className="overlay-dialog ">
          <ForgotPasswordDialog
            onClose={handleCloseForgotPassword}
            onSendEmail={handleSendEmail}
          />
        </div>
      )}
      <div className="overlay-dialog">
        <h1 className="text-center text-white">{status}</h1>
      </div>
    </div>
  );
}
