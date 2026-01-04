/**
 * Privacy Policy page for Express Entry Tracker PWA
 * Details data collection, usage, and privacy practices with accessible navigation
 */

import React from "react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Navigation breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li>
              <Link
                href="/"
                className="hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                aria-label="Return to Express Entry Tracker homepage"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-gray-900 font-medium">
              Privacy Policy
            </li>
          </ol>
        </nav>

        {/* Page header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600">
            How we handle your data and protect your privacy when using Express
            Entry Tracker
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </header>

        {/* Privacy summary */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-green-800 mb-3">
            Privacy Summary
          </h2>
          <ul className="text-green-700 space-y-2 text-sm">
            <li className="flex items-start space-x-2">
              <span className="text-green-600 font-bold">•</span>
              <span>
                <strong>No personal data collection:</strong> We do not collect,
                store, or transmit any personal information.
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-600 font-bold">•</span>
              <span>
                <strong>Local storage only:</strong> All data is stored locally
                in your browser using localStorage.
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-600 font-bold">•</span>
              <span>
                <strong>No tracking:</strong> We do not use cookies, analytics,
                or tracking technologies.
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-600 font-bold">•</span>
              <span>
                <strong>Data source:</strong> Express Entry data is fetched from
                public IRCC API endpoints.
              </span>
            </li>
          </ul>
        </div>

        {/* Table of contents */}
        <nav
          className="bg-blue-50 p-4 rounded-lg mb-8"
          aria-labelledby="toc-heading"
        >
          <h2
            id="toc-heading"
            className="text-lg font-semibold text-gray-900 mb-3"
          >
            Table of Contents
          </h2>
          <ol className="space-y-1 text-sm">
            <li>
              <a
                href="#information"
                className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                1. Information We Collect
              </a>
            </li>
            <li>
              <a
                href="#usage"
                className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                2. How We Use Information
              </a>
            </li>
            <li>
              <a
                href="#storage"
                className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                3. Data Storage and Security
              </a>
            </li>
            <li>
              <a
                href="#sharing"
                className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                4. Information Sharing
              </a>
            </li>
            <li>
              <a
                href="#rights"
                className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                5. Your Rights and Choices
              </a>
            </li>
            <li>
              <a
                href="#external"
                className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                6. External Data Sources
              </a>
            </li>
            <li>
              <a
                href="#changes"
                className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                7. Changes to Privacy Policy
              </a>
            </li>
            <li>
              <a
                href="#contact"
                className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                8. Contact Information
              </a>
            </li>
          </ol>
        </nav>

        {/* Main content */}
        <main className="prose prose-lg max-w-none">
          <section id="information" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Information We Collect
            </h2>
            <p className="text-gray-700 mb-4">
              Express Entry Tracker is designed with privacy in mind.{" "}
              <strong>
                We do not collect any personal information about our users.
              </strong>
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Information We DO NOT Collect:
            </h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>
                Personal identification information (names, email addresses,
                phone numbers)
              </li>
              <li>IP addresses or location data</li>
              <li>Browsing history or behavior tracking</li>
              <li>Authentication or login credentials</li>
              <li>Any personally identifiable information (PII)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Information That May Be Stored Locally:
            </h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>Express Entry draw data fetched from public IRCC sources</li>
              <li>
                User preferences (table settings, feature flags, polling
                intervals)
              </li>
              <li>
                Application state (filters, sorting preferences, pagination
                settings)
              </li>
            </ul>
          </section>

          <section id="usage" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. How We Use Information
            </h2>
            <p className="text-gray-700 mb-4">
              The limited information that is stored locally in your browser is
              used exclusively to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>
                <strong>Improve user experience:</strong> Remember your table
                preferences and settings
              </li>
              <li>
                <strong>Provide functionality:</strong> Cache Express Entry data
                to reduce loading times
              </li>
              <li>
                <strong>Enable offline access:</strong> Allow the application to
                work when internet connectivity is limited
              </li>
              <li>
                <strong>Maintain state:</strong> Preserve your selected filters,
                sorting, and view options
              </li>
            </ul>
            <p className="text-gray-700">
              No data is transmitted to external servers beyond fetching public
              Express Entry data from IRCC.
            </p>
          </section>

          <section id="storage" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Data Storage and Security
            </h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Local Storage
            </h3>
            <p className="text-gray-700 mb-4">
              All application data is stored locally in your web browser using:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>
                <strong>localStorage:</strong> For user preferences, settings,
                and cached Express Entry data
              </li>
              <li>
                <strong>Browser memory:</strong> For temporary application state
                during your session
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Data Security
            </h3>
            <p className="text-gray-700 mb-4">
              Since all data is stored locally in your browser:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>
                Data is protected by your browser&apos;s security mechanisms
              </li>
              <li>Only you have access to your locally stored data</li>
              <li>
                Data is automatically deleted when you clear your browser&apos;s
                storage
              </li>
              <li>No data is transmitted to or stored on external servers</li>
            </ul>
          </section>

          <section id="sharing" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Information Sharing
            </h2>
            <p className="text-gray-700 mb-4">
              <strong>
                We do not share, sell, rent, or disclose any information to
                third parties.
              </strong>
            </p>
            <p className="text-gray-700 mb-4">
              Since no personal information is collected and all data is stored
              locally in your browser, there is no information available for us
              to share.
            </p>
            <p className="text-gray-700">
              The only external communication is fetching public Express Entry
              data from official IRCC sources, which does not involve sharing
              any user information.
            </p>
          </section>

          <section id="rights" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Your Rights and Choices
            </h2>
            <p className="text-gray-700 mb-4">
              You have complete control over your data:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>
                <strong>View your data:</strong> All stored data is accessible
                through your browser&apos;s developer tools
              </li>
              <li>
                <strong>Delete your data:</strong> Clear your browser&apos;s
                localStorage or use incognito/private browsing mode
              </li>
              <li>
                <strong>Control data storage:</strong> Disable localStorage in
                your browser settings if desired
              </li>
              <li>
                <strong>Opt out entirely:</strong> Use the application without
                allowing local storage (some features may be limited)
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              How to Clear Your Data
            </h3>
            <ol className="list-decimal pl-6 text-gray-700 mb-4 space-y-1">
              <li>Open your browser&apos;s developer tools (F12)</li>
              <li>
                Navigate to the &quot;Application&quot; or &quot;Storage&quot;
                tab
              </li>
              <li>Find &quot;localStorage&quot; for this domain</li>
              <li>
                Delete the stored entries, or clear all browsing data for this
                site
              </li>
            </ol>
          </section>

          <section id="external" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. External Data Sources
            </h2>
            <p className="text-gray-700 mb-4">
              This application fetches Express Entry draw data from the official
              IRCC API:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>
                <strong>Source:</strong>{" "}
                <a
                  href="https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json"
                  className="text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json
                </a>
              </li>
              <li>
                <strong>Data type:</strong> Public Express Entry draw results
                (draw numbers, dates, minimum scores)
              </li>
              <li>
                <strong>Privacy impact:</strong> This is public information; no
                personal data is involved
              </li>
              <li>
                <strong>Frequency:</strong> Data is fetched automatically at
                user-configurable intervals
              </li>
            </ul>
            <p className="text-gray-700">
              These requests do not include any personal information and are
              standard HTTP requests for public data.
            </p>
          </section>

          <section id="changes" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Changes to Privacy Policy
            </h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time to reflect
              changes in our practices or applicable laws.
            </p>
            <p className="text-gray-700 mb-4">
              Any changes will be posted on this page with an updated &quot;Last
              updated&quot; date. Since we don&apos;t collect contact
              information, we cannot notify users directly of changes.
            </p>
            <p className="text-gray-700">
              <strong>Our commitment to privacy will not change:</strong> We
              will continue to avoid collecting personal information and
              maintaining a privacy-first approach.
            </p>
          </section>

          <section id="contact" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Contact Information
            </h2>
            <p className="text-gray-700 mb-4">
              If you have questions about this Privacy Policy or our privacy
              practices, you can:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>Create an issue in our GitHub repository</li>
              <li>Contact us through the project&apos;s official channels</li>
            </ul>
            <p className="text-gray-700">
              <strong>For immigration-related questions:</strong> Please contact{" "}
              <a
                href="https://www.canada.ca/en/immigration-refugees-citizenship.html"
                className="text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                target="_blank"
                rel="noopener noreferrer"
              >
                Immigration, Refugees and Citizenship Canada (IRCC)
              </a>{" "}
              directly. This application is not affiliated with IRCC.
            </p>
          </section>
        </main>

        {/* Footer navigation */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <Link
              href="/"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              Return to Express Entry Tracker
            </Link>
            <div className="flex items-center space-x-4 text-sm">
              <Link
                href="/terms"
                className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
              >
                Terms of Use
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">
                © {new Date().getFullYear()} Express Entry Tracker
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
