'use client'
import React, { useEffect, useState } from 'react';
import { FaHandshake, FaBuilding } from 'react-icons/fa';
import Link from 'next/link';
import styles from './Home.module.css';

export default function Home() {

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="flex justify-space-between">
      <div className=''>
      {/* Carousel displaying random bids */}
      <h1 className="text-4xl font-bold text-center mt-[60px] ">#EveryoneIsASHARK</h1>

      {/* <h2 className="text-4xl font-bold text-center mt-[60px] ">Become a shark today!</h2> */}
      </div>
      </div>
      <div className="flex flex-wrap items-center justify-center mt-8 md:space-x-[100px]">
        <Link href={{ pathname: '/login', query: { userType: 'investor' } }}>
          <div className={`card bg-gray-900 mx-6 investors-card items-center justify-center lg:h-[300px] lg:w-[500px] text-white font-semibold px-6 py-4 rounded-md cursor-pointer transition-transform  duration-300 ${styles.hoverEffect}`}>
            <FaHandshake className="text-4xl mx-auto mb-4" />
            <h1 className="text-2xl mx-auto text-center mb-2">Investor Dashboard</h1>
            <h1 className='mx-auto text-center '>Find your next investment!</h1>
          </div>
        </Link>

        <Link href={{ pathname: '/login', query: { userType: 'sme' } }}>
          <div className={`card bg-gray-900 mx-6 smes-card items-center justify-center lg:h-[300px] lg:w-[500px]  text-white font-semibold px-6 py-4 rounded-md cursor-pointer transition-transform duration-300 ${styles.hoverEffect}`}>
            <FaBuilding className="text-4xl mx-auto mb-4 " />
            <h1 className="text-2xl mb-2 mx-auto text-center">SME's Dashboard</h1>
            <h1 className='mx-auto text-center'>Find Investors right away!</h1>
          </div>
        </Link>
      <h2 className="text-4xl font-bold text-center mt-[60px] ">
        Support <span className="text-4xl" style={{ color: '#FF9933' }}>#M</span>
        <span className="text-4xl" style={{ color: '#FFFFFF' }}>a</span>
        <span className="text-4xl" style={{ color: '#138808' }}>k</span>
        <span className="text-4xl" style={{ color: '#FF9933' }}>e</span>
        <span className="text-4xl" style={{ color: '#FFFFFF' }}>I</span>
        <span className="text-4xl" style={{ color: '#138808' }}>n</span>
        <span className="text-4xl" style={{ color: '#FF9933' }}>I</span>
        <span className="text-4xl" style={{ color: '#FFFFFF' }}>n</span>
        <span className="text-4xl" style={{ color: '#138808' }}>d</span>
        <span className="text-4xl" style={{ color: '#FF9933' }}>i</span>
        <span className="text-4xl" style={{ color: '#FFFFFF' }}>a</span> by Investing today!
      </h2>
      </div>
    </div>
  );
}
