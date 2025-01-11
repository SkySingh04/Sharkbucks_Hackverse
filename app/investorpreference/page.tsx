'use client'
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDocs, getDoc, collection } from 'firebase/firestore';
import { useSearchParams, useRouter } from 'next/navigation';

interface Loan {
    interest_rate: number;
    tenure: number;
    amount: number;
}

interface Weights {
    interest_rate: number;
    tenure: number;
    amount: number;
}

function normalize_interest_rate(interest_rate: number): number {
    const min_rate = 4.0;
    const max_rate = 20.0;
    return 1 - ((interest_rate - min_rate) / (max_rate - min_rate));
}

function normalize_tenure(tenure: number): number {
    const min_tenure = 12;
    const max_tenure = 60;
    return (tenure - min_tenure) / (max_tenure - min_tenure);
}

function normalize_amount(amount: number): number {
    const min_amount = 10000;
    const max_amount = 1000000;
    return (amount - min_amount) / (max_amount - min_amount);
}

function calculateLoanScore(loan: Loan, weights: Weights): number {
    const normalizedRate = normalize_interest_rate(loan.interest_rate);
    const normalizedTenure = normalize_tenure(loan.tenure);
    const normalizedAmount = normalize_amount(loan.amount);

    return (
        normalizedRate * weights.interest_rate +
        normalizedTenure * weights.tenure +
        normalizedAmount * weights.amount
    ) / (weights.interest_rate + weights.tenure + weights.amount);
}

const ViewApplicationPage = () => {
    const search = useSearchParams();
    const preferenceId = search.get('id');
    const router = useRouter();
    const [scores, setScores] = useState<number[]>([]);
    const [ids, setIds] = useState<string[]>([]);
    const [application, setApplication] = useState<any>(null);
    const [allApplications, setAllApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loanScores, setLoanScores] = useState<number[]>([]);
    
    useEffect(() => {
        if (application && allApplications) {
            const weights: Weights = {
                interest_rate: 0.4,
                tenure: 0.3,
                amount: 0.3
            };
             // Calculate tag-based scores
             const tagScores = allApplications.map(app => {
                if (!Array.isArray(app.tags)) return 0;
                return app.tags.reduce((score: number, tag: string) => {
                    return score + (application.preferences.includes(tag) ? 1 : 0);
                }, 0) / application.preferences.length;
            });

            // Calculate loan-based scores
            const loans = allApplications.map(app => ({
                interest_rate: app.interestRate || 12,
                tenure: app.loanTenure || 36,
                amount: app.loanAmount || 100000
            }));

            const financialScores = loans.map(loan => calculateLoanScore(loan, weights));

            // Combine scores (70% tags, 30% loan parameters)
            const combinedScores = tagScores.map((tagScore, index) => 
                tagScore * 0.7 + financialScores[index] * 0.3
            );

            const sortedIndices = combinedScores
                .map((score, index) => ({ score, index }))
                .sort((a, b) => b.score - a.score)
                .map(item => item.index);

            setScores(sortedIndices.map(index => combinedScores[index]));
            setIds(sortedIndices.map(index => allApplications[index].id));
            setLoanScores(sortedIndices.map(index => financialScores[index]));
        }
    }, [application, allApplications]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await Promise.all([fetchPreference(), fetchApplications()]);
            setLoading(false);
        };
        fetchData();
    }, [preferenceId]);

    useEffect(() => {
        if (application && allApplications) {
            getDataFromApplications();
        }
    }, [application, allApplications]);

    const fetchApplications = async () => {
        try {
            const snapshot = await getDocs(collection(db, "applications"));
            const applications = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));
            setAllApplications(applications);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const fetchPreference = async () => {
        if (preferenceId) {
            try {
                const prefSnap = await getDoc(doc(db, 'preferences', preferenceId));
                if (prefSnap.exists()) {
                    setApplication(prefSnap.data());
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
    };

    const getDataFromApplications = () => {
        const matchScores = allApplications.map(app => {
            if (!Array.isArray(app.tags)) return 0;
            return app.tags.reduce((score: any, tag: any) => {
                return score + (application.preferences.includes(tag) ? 1 : 0);
            }, 0);
        });

        const sortedIndices = matchScores
            .map((score, index) => ({ score, index }))
            .sort((a, b) => b.score - a.score)
            .map(item => item.index);

        setScores(sortedIndices.map(index => matchScores[index]));
        setIds(sortedIndices.map(index => allApplications[index].id));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-white text-xl">Loading recommendations...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white mb-4">Investment Recommendations</h1>
                    <p className="text-gray-300 text-lg">Personalized matches based on your preferences</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                                {/* <div 
                                    key={application.id} 
                                    className={`application-card ${application.isSpecial ? 'special-border' : ''} ${application.fundingStatus === 'finalized' ? 'bg-green-800' : ''}`}
                                    title={application.isSpecial ? 'No transaction fees for this application!' : ''}
                                >
                                    <div className="relative group">
                                        <h3 className='company-name'>
                                            {application.companyName}
                                            {application.isSpecial && (
                                                <span className="ml-2">🌱</span>
                                            )}
                                        </h3>
                                        {application.isSpecial && (
                                            <div className="absolute invisible group-hover:visible bg-green-100 text-green-800 p-2 rounded-md shadow-lg z-10 w-48 text-sm">
                                                No transaction fees for this application!
                                            </div>
                                        )} */}
                    {allApplications
                        ?.filter((app: any) => ids.includes(app.id))
                        .map((app: any, index: number) => (
                            <div
                                key={app.id}
                                className={`bg-gray-800 ${application.isSpecial ? 'special-border' : ''} rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105`}
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="bg-blue-900 text-white px-3 py-1 rounded-full text-sm">
                                            Rank #{index + 1}
                                        </span>
                                        <div className="flex justify-between text-sm text-blue-200 mb-2">
                                    <span>Tag Match: {((scores[index] * 100).toFixed(0))}%</span>
                                    <span>Loan Score: {((loanScores[index] * 100).toFixed(0))}%</span>
                                </div>
                                    </div>
                                    
                                    <h2 className="text-2xl font-bold text-white mb-2">
                                        {app.companyName || 'Company Name'}
                                    </h2>
                                    {application.isSpecial && (
                                                <span className="ml-2">🌱</span>
                                            )}
                                            {application.isSpecial && (
                                            <div className="absolute invisible group-hover:visible bg-green-100 text-green-800 p-2 rounded-md shadow-lg z-10 w-48 text-sm">
                                                No transaction fees for this application!
                                            </div>
                                        )}
                                    
                                    <div className="mb-4">
                                        <p className="text-blue-200">
                                            Requested Amount: {app.loanAmount} APT (₹{ (app.loanAmount * 777.36)})
                                        </p>
                                    </div>

                                    {app.tags && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {app.tags.map((tagObj: { tag: string, isSpecial: boolean }, i: number) => (
                                                <span
                                                    key={i}
                                                    className="bg-blue-900/50 text-blue-200 px-2 py-1 rounded-full text-sm"
                                                >
                                                    {tagObj.tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    
                                    <button
                                        onClick={() => router.push(`/viewapplication?id=${app.id}`)}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default ViewApplicationPage;
