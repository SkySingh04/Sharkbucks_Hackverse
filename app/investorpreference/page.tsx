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

const ViewApplicationPage = () => {
    const search = useSearchParams();
    const preferenceId = search.get('id');
    const router = useRouter();
    const [scores, setScores] = useState<number[]>([]);
    const [ids, setIds] = useState<string[]>([]);
    const [application, setApplication] = useState<any>(null);
    const [allApplications, setAllApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
                    {allApplications
                        ?.filter((app: any) => ids.includes(app.id))
                        .map((app: any, index: number) => (
                            <div
                                key={app.id}
                                className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105"
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="bg-blue-900 text-white px-3 py-1 rounded-full text-sm">
                                            Rank #{index + 1}
                                        </span>
                                        <span className="text-blue-200">
                                            Match Score: {((scores[index] / application.preferences.length) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    
                                    <h2 className="text-2xl font-bold text-white mb-2">
                                        {app.companyName || 'Company Name'}
                                    </h2>
                                    
                                    <div className="mb-4">
                                        <p className="text-blue-200">
                                            Requested Amount: ${app.loanAmount?.toLocaleString() || 'N/A'}
                                        </p>
                                    </div>

                                    {app.tags && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {app.tags.map((tag: string, i: number) => (
                                                <span
                                                    key={i}
                                                    className="bg-blue-900/50 text-blue-200 px-2 py-1 rounded-full text-sm"
                                                >
                                                    {tag}
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