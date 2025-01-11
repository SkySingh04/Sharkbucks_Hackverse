import React from "react";
import { useState } from 'react';
import { useRouter } from "next/navigation";
import {auth} from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import toast from "react-hot-toast";
function SignInForm({userType} : any) {
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);

  const [state, setState] = React.useState({
    email: "",
    password: ""
  });
  const handleChange = (evt : any) => {
    const value = evt.target.value;
    setState({
      ...state,
      [evt.target.name]: value
    });
  };

  const handleSubmit = (event :React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    let email = data.get('email') as string;
    let password = data.get('password') as string;
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        toast.success("Sign in successful");
        console.log("userType in signin form", userType)
        if (userType == "Innovator!") {
          router.push(`/smedashboard`);
        }
        else if (userType == "Investor!") {
          router.push(`/investor`);
        }
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
        toast.error("Sign in failed");
        setError(errorMessage); // Set the error message

      });
  }

  return (
    <div className="form-container sign-in-container">
      <form onSubmit={handleSubmit} className="loginform bg-customBlue">
        <h1>Sign in</h1>
        <input
        className="bg-customBeige text-black"
          type="email"
          placeholder="Email"
          name="email"
          value={state.email}
          onChange={handleChange}
        />
        <input
        className="bg-customBeige text-black"
          type="password"
          name="password"
          placeholder="Password"
          value={state.password}
          onChange={handleChange}
        />
        <button className="loginbutton bg-customViolet">Sign In</button>
        {error && (
            <p className="text-red-700 border border-black">
              {error}
            </p>
          )}
      </form>
    </div>
  );
}

export default SignInForm;
