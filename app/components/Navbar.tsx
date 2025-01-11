'use client'
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {auth} from '../firebase';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import toast from 'react-hot-toast';

const Navbar = () => {
  const [user, setUser] = useState(null); // Use state to track the user's authentication state
  const router = useRouter();

  // Add a useEffect to listen for changes in the user's authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user:any) => {
      setUser(user); // Update the user state when the authentication state changes
    });

    // Clean up the subscription when the component unmounts
    return () => {
      unsubscribe();
    };
  }, []);

  const handlesignOut = () => {
    // Sign out the user
    signOut(auth).then(() => {
      // Sign-out successful.
      toast.success("Sign out successful");
      router.push(`/`);

    }).catch((error) => {
      // An error happened.
      console.log(error);
      toast.error("Unable to sign out")
    });

    // After successful sign-out, you can also clear the user state if needed
    setUser(null);

    router.push(`/`);
  };

  return (
    <div className="navbar fixed top-0 w-full z-50 bg-slate-800 text-white  flex justify-between">
      <div className="navbar-start">
      <a href="/" className="font-bold p-2">
      SharkBucks {/* Add your logo here */}
      </a>
      </div>
      <div className="navbar-end text-center">
      <ul className="menu menu-horizontal px-0">
        <li><a href="/">Home</a></li>
        {user ? ( // Check if the user is logged in
        <>
          <li>
          <a onClick={handlesignOut}>Sign Out</a>
          </li>
        </>
        ) : (
        <>
          <li><a href="/login">Login</a></li>
        </>
        )}
      </ul>
      </div>
    </div>
  );
}

export default Navbar;
