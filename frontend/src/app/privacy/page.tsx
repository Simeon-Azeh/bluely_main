'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiArrowLeft } from 'react-icons/fi';

export default function PrivacyPage() {
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
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Privacy & Data Protection</h1>
                    <p className="text-gray-500 mb-8">Last updated: March 7, 2026</p>

                    <div className="prose prose-gray max-w-none space-y-8">
                        {/* Introduction */}
                        <section>
                            <p className="text-gray-600 leading-relaxed">
                                Bluely (&quot;we&quot;, &quot;our&quot;, &quot;the Service&quot;) is committed to protecting
                                your privacy and personal data. This Privacy Policy explains what data we collect,
                                how we use it, how we protect it, and your rights regarding your data.
                            </p>
                            <p className="text-gray-600 leading-relaxed mt-3">
                                Because Bluely handles sensitive health information, we take data protection
                                especially seriously. Please read this policy carefully to understand our practices.
                            </p>
                        </section>

                        {/* 1. Data Controller */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Data Controller</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Bluely is the data controller responsible for your personal data. For any
                                privacy-related inquiries, you can reach us at:
                            </p>
                            <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                                <p className="text-gray-700 font-medium">Bluely Data Protection</p>
                                <p className="text-gray-600 text-sm mt-1">Email: privacy@bluely.health</p>
                            </div>
                        </section>

                        {/* 2. Data We Collect */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Data We Collect</h2>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                We collect and process the following categories of data:
                            </p>

                            <h3 className="text-lg font-medium text-gray-800 mb-2">2.1 Account Information</h3>
                            <ul className="list-disc pl-6 space-y-1.5 text-gray-600 mb-4">
                                <li>Full name and display name</li>
                                <li>Email address</li>
                                <li>Authentication credentials (securely managed by Firebase Authentication)</li>
                                <li>Account creation date and email verification status</li>
                            </ul>

                            <h3 className="text-lg font-medium text-gray-800 mb-2">2.2 Health Profile Data</h3>
                            <ul className="list-disc pl-6 space-y-1.5 text-gray-600 mb-4">
                                <li>Diabetes type (Type 1, Type 2, Pre-diabetes, Gestational)</li>
                                <li>Year of diagnosis</li>
                                <li>Current medications and treatment regimen</li>
                                <li>Target glucose range preferences</li>
                                <li>Measurement unit preference (mg/dL or mmol/L)</li>
                            </ul>

                            <h3 className="text-lg font-medium text-gray-800 mb-2">2.3 Health & Lifestyle Data</h3>
                            <ul className="list-disc pl-6 space-y-1.5 text-gray-600 mb-4">
                                <li>Blood glucose readings with timestamps and contextual tags (fasting, pre-meal, post-meal, bedtime)</li>
                                <li>Meal logs including food descriptions and carbohydrate estimates</li>
                                <li>Medication records including dosage and timing</li>
                                <li>Physical activity type, duration, and intensity</li>
                                <li>Mood and stress level logs</li>
                                <li>Sleep duration, hydration, and alcohol intake indicators</li>
                                <li>Notes and contextual information you choose to add</li>
                            </ul>

                            <h3 className="text-lg font-medium text-gray-800 mb-2">2.4 Technical Data</h3>
                            <ul className="list-disc pl-6 space-y-1.5 text-gray-600">
                                <li>Device type and browser information (for responsive experience)</li>
                                <li>Firebase authentication tokens (for secure API access)</li>
                                <li>App usage patterns (features accessed, interaction timestamps)</li>
                            </ul>
                        </section>

                        {/* 3. How We Use Your Data */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Data</h2>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                Your data is used for the following purposes:
                            </p>

                            <h3 className="text-lg font-medium text-gray-800 mb-2">3.1 Core Service Delivery</h3>
                            <ul className="list-disc pl-6 space-y-1.5 text-gray-600 mb-4">
                                <li>Displaying your logged health data in charts, timelines, and summaries</li>
                                <li>Calculating time-in-range percentages and daily/weekly statistics</li>
                                <li>Estimating HbA1c values from your glucose history using the ADAG formula</li>
                                <li>Tracking medication adherence and activity patterns</li>
                            </ul>

                            <h3 className="text-lg font-medium text-gray-800 mb-2">3.2 Machine Learning Predictions</h3>
                            <ul className="list-disc pl-6 space-y-1.5 text-gray-600 mb-4">
                                <li>
                                    Generating 1-hour glucose forecasts using your recent glucose readings,
                                    meal data, medication timing, activity level, and lifestyle factors
                                </li>
                                <li>
                                    Producing risk assessments (low, moderate, high) based on 21 physiological
                                    and behavioral features
                                </li>
                                <li>
                                    Identifying trends and generating observational insights from your data patterns
                                </li>
                            </ul>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                ML predictions are processed server-side. Your individual data is sent to our
                                prediction service via secure HTTPS connections and is not stored by the ML service
                                beyond the request lifecycle.
                            </p>

                            <h3 className="text-lg font-medium text-gray-800 mb-2 mt-4">3.3 Account Management</h3>
                            <ul className="list-disc pl-6 space-y-1.5 text-gray-600">
                                <li>Authenticating your identity and securing your account</li>
                                <li>Sending email verification and password reset emails</li>
                                <li>Delivering optional medication and glucose logging reminders</li>
                            </ul>
                        </section>

                        {/* 4. Legal Basis */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Legal Basis for Processing</h2>
                            <p className="text-gray-600 leading-relaxed">
                                We process your data on the following legal bases:
                            </p>
                            <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-600">
                                <li>
                                    <strong>Consent:</strong> You explicitly consent to health data processing when you
                                    create an account and agree to these terms. You can withdraw consent at any time by
                                    deleting your account.
                                </li>
                                <li>
                                    <strong>Contract performance:</strong> Processing is necessary to provide you with
                                    the Service features you signed up for.
                                </li>
                                <li>
                                    <strong>Legitimate interest:</strong> Anonymized, aggregated data may be used to
                                    improve model accuracy, which benefits all users.
                                </li>
                            </ul>
                        </section>

                        {/* 5. Data Storage & Security */}
                        <section className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                            <h2 className="text-xl font-semibold text-blue-900 mb-3">5. Data Storage & Security</h2>

                            <h3 className="text-lg font-medium text-blue-800 mb-2">5.1 Where Your Data Is Stored</h3>
                            <ul className="list-disc pl-6 space-y-1.5 text-blue-800 mb-4">
                                <li>
                                    <strong>Authentication data</strong> is managed by Google Firebase Authentication,
                                    hosted on Google Cloud infrastructure with SOC 2 and ISO 27001 compliance.
                                </li>
                                <li>
                                    <strong>Health data</strong> (glucose readings, meals, medications, activities,
                                    lifestyle logs) is stored in MongoDB Atlas, which provides encryption at rest and
                                    in transit.
                                </li>
                                <li>
                                    <strong>Application backend and ML service</strong> are hosted on Render with
                                    HTTPS-only access.
                                </li>
                            </ul>

                            <h3 className="text-lg font-medium text-blue-800 mb-2">5.2 Security Measures</h3>
                            <ul className="list-disc pl-6 space-y-1.5 text-blue-800">
                                <li>All data transmitted between your device and our servers uses TLS/HTTPS encryption</li>
                                <li>Firebase Authentication handles password hashing and token management</li>
                                <li>API requests require valid Firebase ID tokens (Bearer authentication)</li>
                                <li>Database access is restricted to authenticated, authorized requests only</li>
                                <li>Passwords are never stored in plaintext — Firebase uses industry-standard bcrypt hashing</li>
                                <li>Admin SDK credentials are stored as environment variables, never in client code</li>
                            </ul>
                        </section>

                        {/* 6. Data Retention */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Retention</h2>
                            <ul className="list-disc pl-6 space-y-2 text-gray-600">
                                <li>
                                    <strong>Active accounts:</strong> Your data is retained for as long as your account
                                    remains active. This enables continuous trend analysis and long-term insights.
                                </li>
                                <li>
                                    <strong>Account deletion:</strong> When you delete your account, all personal data
                                    and health records are permanently removed from our databases within 30 days.
                                </li>
                                <li>
                                    <strong>Anonymized data:</strong> Previously anonymized, aggregated data used for
                                    model training cannot be traced back to individuals and may be retained.
                                </li>
                            </ul>
                        </section>

                        {/* 7. Your Rights */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your Rights</h2>
                            <p className="text-gray-600 leading-relaxed mb-3">
                                You have the following rights regarding your personal data:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-600">
                                <li>
                                    <strong>Right of access:</strong> You can view all your stored data through the app
                                    at any time, including glucose history, meal logs, and health profile.
                                </li>
                                <li>
                                    <strong>Right to rectification:</strong> You can edit or correct any data you have
                                    entered through the app interface.
                                </li>
                                <li>
                                    <strong>Right to erasure:</strong> You can delete your account and all associated
                                    data through the Settings page.
                                </li>
                                <li>
                                    <strong>Right to data portability:</strong> You can request an export of your data
                                    by contacting us at privacy@bluely.health.
                                </li>
                                <li>
                                    <strong>Right to restrict processing:</strong> You can request that we limit how we
                                    use your data while a concern is being resolved.
                                </li>
                                <li>
                                    <strong>Right to object:</strong> You can object to processing based on legitimate
                                    interest by contacting us.
                                </li>
                                <li>
                                    <strong>Right to withdraw consent:</strong> You can withdraw consent at any time
                                    by deleting your account.
                                </li>
                            </ul>
                        </section>

                        {/* 8. Third-Party Services */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Third-Party Services</h2>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                We use the following third-party services to operate Bluely:
                            </p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-gray-600 border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-2 pr-4 font-medium text-gray-800">Service</th>
                                            <th className="text-left py-2 pr-4 font-medium text-gray-800">Purpose</th>
                                            <th className="text-left py-2 font-medium text-gray-800">Data Shared</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        <tr>
                                            <td className="py-2 pr-4">Google Firebase</td>
                                            <td className="py-2 pr-4">Authentication, email verification</td>
                                            <td className="py-2">Email, name, auth tokens</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2 pr-4">MongoDB Atlas</td>
                                            <td className="py-2 pr-4">Database hosting</td>
                                            <td className="py-2">All health and profile data</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2 pr-4">Render</td>
                                            <td className="py-2 pr-4">Backend and ML service hosting</td>
                                            <td className="py-2">Data in transit (encrypted)</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2 pr-4">Vercel</td>
                                            <td className="py-2 pr-4">Frontend hosting (alternative)</td>
                                            <td className="py-2">Static assets, no health data</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-gray-600 text-sm mt-4">
                                We do not sell, rent, or trade your personal data to any third party. Data shared
                                with the above services is strictly limited to what is necessary for them to operate.
                            </p>
                        </section>

                        {/* 9. Cookies */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Cookies & Local Storage</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Bluely uses minimal cookies and browser storage:
                            </p>
                            <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-600">
                                <li>
                                    <strong>Authentication tokens:</strong> Stored securely by Firebase SDK to maintain
                                    your login session.
                                </li>
                                <li>
                                    <strong>Local preferences:</strong> UI preferences (such as theme settings) may be
                                    stored in browser local storage.
                                </li>
                                <li>
                                    <strong>Service worker:</strong> Used for PWA offline capability and push
                                    notifications, if enabled.
                                </li>
                            </ul>
                            <p className="text-gray-600 leading-relaxed mt-3">
                                We do not use advertising cookies, analytics trackers, or third-party marketing pixels.
                            </p>
                        </section>

                        {/* 10. Children's Privacy */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Children&apos;s Privacy</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Bluely is not intended for children under 16 years of age. We do not knowingly collect
                                personal data from children under 16. If you believe a child under 16 has created an
                                account, please contact us immediately so we can delete the account and associated data.
                            </p>
                        </section>

                        {/* 11. ML Data Usage */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Machine Learning & Your Data</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Our machine learning models are currently trained on synthetic physiological data, not
                                on real user data. However, as the Service evolves:
                            </p>
                            <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-600">
                                <li>
                                    We may use anonymized, aggregated user data to improve model accuracy in the future.
                                    If we do, no individual user will be identifiable from this data.
                                </li>
                                <li>
                                    Real-time predictions use your individual data only for the duration of the API
                                    request. It is not stored by the ML service.
                                </li>
                                <li>
                                    You will be notified and your consent will be sought before any change in how your
                                    data is used for model training.
                                </li>
                            </ul>
                        </section>

                        {/* 12. International Data */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. International Data Transfers</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Your data may be processed in data centers located outside your country of residence,
                                including in the United States (Google Cloud, MongoDB Atlas). These transfers are
                                protected by:
                            </p>
                            <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-600">
                                <li>Standard contractual clauses with our service providers</li>
                                <li>The privacy and security certifications held by our infrastructure providers</li>
                                <li>Encryption in transit and at rest for all health data</li>
                            </ul>
                        </section>

                        {/* 13. Data Breach */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Data Breach Notification</h2>
                            <p className="text-gray-600 leading-relaxed">
                                In the unlikely event of a data breach that affects your personal data:
                            </p>
                            <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-600">
                                <li>We will notify affected users via email within 72 hours of discovery</li>
                                <li>We will describe the nature of the breach and the data potentially affected</li>
                                <li>We will outline the steps we are taking to mitigate the breach</li>
                                <li>We will report the breach to relevant data protection authorities as required by law</li>
                            </ul>
                        </section>

                        {/* 14. Changes */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Changes to This Policy</h2>
                            <p className="text-gray-600 leading-relaxed">
                                We may update this Privacy Policy periodically. Changes will be posted on this page
                                with an updated &quot;Last updated&quot; date. For significant changes affecting how we
                                process health data, we will notify you via email or in-app notification before the
                                changes take effect.
                            </p>
                        </section>

                        {/* 15. Contact */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">15. Contact Us</h2>
                            <p className="text-gray-600 leading-relaxed">
                                For any questions, concerns, or requests related to your privacy and data protection:
                            </p>
                            <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-1">
                                <p className="text-gray-700 font-medium">Bluely Data Protection Team</p>
                                <p className="text-gray-600 text-sm">General inquiries: support@bluely.health</p>
                                <p className="text-gray-600 text-sm">Privacy-specific: privacy@bluely.health</p>
                            </div>
                        </section>
                    </div>

                    {/* Footer nav */}
                    <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3 justify-between items-center">
                        <Link
                            href="/terms"
                            className="text-[#1F2F98] hover:text-[#1F2F98]/80 font-medium text-sm"
                        >
                            ← Terms of Service
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
