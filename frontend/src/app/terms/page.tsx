'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiArrowLeft } from 'react-icons/fi';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-3">
                        <Image
                            src="/icons/full_logotext.png"
                            alt="Bluely"
                            width={120}
                            height={36}
                            className="h-8 w-auto"
                        />
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
                    >
                        <FiArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
                    <p className="text-gray-500 mb-8">Last updated: March 7, 2026</p>

                    <div className="prose prose-gray max-w-none space-y-8">
                        {/* 1. Acceptance */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
                            <p className="text-gray-600 leading-relaxed">
                                By creating an account, accessing, or using Bluely (&quot;the Service&quot;), you agree to be
                                bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you
                                may not use the Service. These Terms constitute a legally binding agreement between you
                                and Bluely.
                            </p>
                            <p className="text-gray-600 leading-relaxed mt-3">
                                We may update these Terms from time to time. Continued use of the Service after changes
                                constitutes acceptance of the updated Terms. We will notify you of significant changes
                                via email or in-app notification.
                            </p>
                        </section>

                        {/* 2. Description of Service */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Bluely is a digital diabetes self-management platform that enables users to:
                            </p>
                            <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-600">
                                <li>Log and track blood glucose readings with contextual information</li>
                                <li>Record meals, medications, physical activity, mood, and lifestyle factors</li>
                                <li>View historical trends, statistics, and time-in-range analysis</li>
                                <li>Receive machine-learning-powered glucose predictions and risk assessments</li>
                                <li>Receive estimated HbA1c values based on logged glucose readings</li>
                                <li>Access personalized observational insights based on logged data patterns</li>
                            </ul>
                        </section>

                        {/* 3. Medical Disclaimer */}
                        <section className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                            <h2 className="text-xl font-semibold text-amber-900 mb-3">3. Medical Disclaimer — Important</h2>
                            <p className="text-amber-800 leading-relaxed font-medium">
                                Bluely is NOT a medical device, and the Service does NOT provide medical advice,
                                diagnosis, or treatment.
                            </p>
                            <ul className="list-disc pl-6 mt-3 space-y-2 text-amber-800">
                                <li>
                                    All predictions, risk assessments, HbA1c estimates, and insights are
                                    <strong> informational only</strong> and are based on patterns in your logged data.
                                </li>
                                <li>
                                    Machine learning predictions are generated from synthetic physiological models and
                                    should not be used for insulin dosing, medication changes, or clinical decisions.
                                </li>
                                <li>
                                    Always consult a qualified healthcare professional before making any changes to your
                                    diabetes management plan.
                                </li>
                                <li>
                                    In case of a medical emergency, contact your local emergency services immediately.
                                    Do not rely on Bluely for emergency medical assistance.
                                </li>
                                <li>
                                    The accuracy of predictions depends on the completeness and accuracy of the data
                                    you provide. Bluely cannot verify the accuracy of user-entered information.
                                </li>
                            </ul>
                        </section>

                        {/* 4. Eligibility */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Eligibility</h2>
                            <p className="text-gray-600 leading-relaxed">
                                You must be at least 16 years of age to use the Service. If you are between 16 and 18
                                years old, you must have the consent of a parent or legal guardian. By using the Service,
                                you represent that you meet these eligibility requirements.
                            </p>
                        </section>

                        {/* 5. Account */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Account Registration & Security</h2>
                            <p className="text-gray-600 leading-relaxed">
                                To use the Service, you must create an account using a valid email address. You agree to:
                            </p>
                            <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-600">
                                <li>Provide accurate and complete registration information</li>
                                <li>Verify your email address when prompted</li>
                                <li>Maintain the security of your password and account credentials</li>
                                <li>Not share your account with others or allow unauthorized access</li>
                                <li>Notify us immediately of any unauthorized use of your account</li>
                            </ul>
                            <p className="text-gray-600 leading-relaxed mt-3">
                                You are responsible for all activity that occurs under your account. Bluely is not
                                liable for any loss or damage arising from unauthorized access to your account.
                            </p>
                        </section>

                        {/* 6. User Data */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. User Data & Content</h2>
                            <p className="text-gray-600 leading-relaxed">
                                You retain ownership of all health data and information you enter into the Service,
                                including glucose readings, meal logs, medication records, and lifestyle data. By using
                                the Service, you grant Bluely a limited license to:
                            </p>
                            <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-600">
                                <li>Store, process, and display your data to provide the Service features</li>
                                <li>Use anonymized, aggregated data to improve our machine learning models</li>
                                <li>Generate predictions and insights based on your logged data</li>
                            </ul>
                            <p className="text-gray-600 leading-relaxed mt-3">
                                You are responsible for the accuracy of the data you enter. Inaccurate data may lead
                                to unreliable predictions and insights.
                            </p>
                        </section>

                        {/* 7. Acceptable Use */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Acceptable Use</h2>
                            <p className="text-gray-600 leading-relaxed">You agree not to:</p>
                            <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-600">
                                <li>Use the Service for any unlawful purpose</li>
                                <li>Attempt to gain unauthorized access to our systems or other users&apos; accounts</li>
                                <li>Interfere with or disrupt the Service or its infrastructure</li>
                                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                                <li>Use automated tools to scrape, crawl, or extract data from the Service</li>
                                <li>Misrepresent your identity or impersonate another person</li>
                                <li>Use the Service to provide medical advice to others</li>
                            </ul>
                        </section>

                        {/* 8. ML Predictions */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Machine Learning Predictions & Insights</h2>
                            <p className="text-gray-600 leading-relaxed">
                                The Service uses machine learning models to generate glucose predictions, risk
                                assessments, and observational insights. You acknowledge and agree that:
                            </p>
                            <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-600">
                                <li>
                                    Predictions are probabilistic estimates, not guaranteed outcomes. Actual glucose
                                    values may differ significantly from predicted values.
                                </li>
                                <li>
                                    Models are trained on synthetic physiological data and may not perfectly reflect
                                    your individual physiology.
                                </li>
                                <li>
                                    All insights use observational, non-directive language and are not medical
                                    instructions.
                                </li>
                                <li>
                                    The &quot;input completeness&quot; requirement exists for your safety — partial data can
                                    lead to misleading predictions. When required data is missing, the Service will
                                    prompt you to log it rather than generating an unreliable prediction.
                                </li>
                                <li>
                                    HbA1c estimates are calculated using the ADAG formula and require sufficient
                                    glucose readings. They are approximations and do not replace laboratory HbA1c
                                    tests.
                                </li>
                            </ul>
                        </section>

                        {/* 9. Intellectual Property */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Intellectual Property</h2>
                            <p className="text-gray-600 leading-relaxed">
                                The Service, including its design, code, machine learning models, algorithms, graphics,
                                and content (excluding user-entered data), is owned by Bluely and protected by
                                intellectual property laws. You may not copy, modify, distribute, or create derivative
                                works based on the Service without prior written consent.
                            </p>
                        </section>

                        {/* 10. Service Availability */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Service Availability & Modifications</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Bluely is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We do not guarantee
                                uninterrupted or error-free access. We reserve the right to:
                            </p>
                            <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-600">
                                <li>Modify, suspend, or discontinue any feature of the Service at any time</li>
                                <li>Perform maintenance that may temporarily affect availability</li>
                                <li>Update machine learning models, which may change prediction behavior</li>
                                <li>Set limits on usage or storage</li>
                            </ul>
                        </section>

                        {/* 11. Termination */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Account Termination</h2>
                            <p className="text-gray-600 leading-relaxed">
                                You may delete your account at any time through the Settings page. Upon deletion:
                            </p>
                            <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-600">
                                <li>Your personal data will be permanently deleted from our systems</li>
                                <li>Your Firebase authentication account will be removed</li>
                                <li>
                                    Previously anonymized, aggregated data used for model improvement cannot be
                                    individually identified or removed
                                </li>
                            </ul>
                            <p className="text-gray-600 leading-relaxed mt-3">
                                We may suspend or terminate your account if you violate these Terms, engage in
                                fraudulent activity, or pose a risk to other users or the Service.
                            </p>
                        </section>

                        {/* 12. Limitation of Liability */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Limitation of Liability</h2>
                            <p className="text-gray-600 leading-relaxed">
                                To the maximum extent permitted by law, Bluely and its developers, affiliates, and
                                partners shall not be liable for:
                            </p>
                            <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-600">
                                <li>
                                    Any health outcomes resulting from reliance on the Service&apos;s predictions,
                                    insights, or data
                                </li>
                                <li>Any indirect, incidental, special, or consequential damages</li>
                                <li>Loss of data due to technical failures or service interruptions</li>
                                <li>
                                    Inaccurate predictions or insights resulting from user-entered data errors
                                </li>
                                <li>Any actions taken based on the Service&apos;s observational insights</li>
                            </ul>
                        </section>

                        {/* 13. Indemnification */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Indemnification</h2>
                            <p className="text-gray-600 leading-relaxed">
                                You agree to indemnify and hold harmless Bluely, its developers, and affiliates from
                                any claims, damages, or expenses arising from your use of the Service, violation of
                                these Terms, or infringement of any third-party rights.
                            </p>
                        </section>

                        {/* 14. Governing Law */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Governing Law</h2>
                            <p className="text-gray-600 leading-relaxed">
                                These Terms are governed by and construed in accordance with the laws of the Republic
                                of Cameroon. Any disputes arising from these Terms or the Service shall be resolved
                                through the courts of competent jurisdiction in Cameroon.
                            </p>
                        </section>

                        {/* 15. Contact */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">15. Contact Information</h2>
                            <p className="text-gray-600 leading-relaxed">
                                If you have any questions about these Terms, please contact us at:
                            </p>
                            <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                                <p className="text-gray-700 font-medium">Bluely Support</p>
                                <p className="text-gray-600 text-sm mt-1">Email: support@bluely.health</p>
                            </div>
                        </section>
                    </div>

                    {/* Footer nav */}
                    <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3 justify-between items-center">
                        <Link
                            href="/privacy"
                            className="text-[#1F2F98] hover:text-[#1F2F98]/80 font-medium text-sm"
                        >
                            Privacy & Data Protection →
                        </Link>
                        <Link
                            href="/signup"
                            className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                            Back to Sign Up
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
