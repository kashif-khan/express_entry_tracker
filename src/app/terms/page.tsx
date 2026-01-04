/**
 * Terms of Use page for Express Entry Tracker PWA
 * Provides legal disclaimers and usage terms with accessible navigation
 */

import React from "react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
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
              Terms of Use
            </li>
          </ol>
        </nav>

        {/* Page header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Terms of Use
          </h1>
          <p className="text-lg text-gray-600">
            Legal terms and conditions for using the Express Entry Tracker
            application
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </header>

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
                href="#acceptance"
                className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                1. Acceptance of Terms
              </a>
            </li>
            <li>
              <a
                href="#data-source"
                className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                2. Data Source and Accuracy
              </a>
            </li>
            <li>
              <a
                href="#disclaimer"
                className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                3. Disclaimer of Warranties
              </a>
            </li>
            <li>
              <a
                href="#limitation"
                className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                4. Limitation of Liability
              </a>
            </li>
            <li>
              <a
                href="#usage"
                className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                5. Acceptable Use
              </a>
            </li>
            <li>
              <a
                href="#privacy"
                className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                6. Privacy and Data Handling
              </a>
            </li>
            <li>
              <a
                href="#changes"
                className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                7. Changes to Terms
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
          <section id="acceptance" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-700 mb-4">
              By accessing and using the Express Entry Tracker application
              (&quot;the Service&quot;), you accept and agree to be bound by the
              terms and provision of this agreement. If you do not agree to
              abide by the above, please do not use this service.
            </p>
            <p className="text-gray-700">
              This application is provided for informational purposes only and
              is not affiliated with Immigration, Refugees and Citizenship
              Canada (IRCC) or the Government of Canada.
            </p>
          </section>

          <section id="data-source" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Data Source and Accuracy
            </h2>
            <p className="text-gray-700 mb-4">
              The Express Entry draw data displayed in this application is
              sourced from publicly available IRCC data at{" "}
              <a
                href="https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json"
                className="text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                target="_blank"
                rel="noopener noreferrer"
              >
                canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json
              </a>
              .
            </p>
            <p className="text-gray-700 mb-4">
              While we strive to provide accurate and up-to-date information, we
              make no representations or warranties about the accuracy,
              completeness, or suitability of the data for any purpose.
            </p>
            <p className="text-gray-700">
              <strong>
                Always verify information directly with official IRCC sources
                before making any immigration-related decisions.
              </strong>
            </p>
          </section>

          <section id="disclaimer" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Disclaimer of Warranties
            </h2>
            <p className="text-gray-700 mb-4">
              The information on this application is provided on an &quot;as
              is&quot; basis. To the fullest extent permitted by law, we exclude
              all representations, warranties, and conditions relating to our
              website and the use of this website.
            </p>
            <p className="text-gray-700">
              This application is not intended to provide immigration advice.
              For official immigration guidance, consult with qualified
              immigration professionals or IRCC directly.
            </p>
          </section>

          <section id="limitation" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Limitation of Liability
            </h2>
            <p className="text-gray-700 mb-4">
              In no event shall the Express Entry Tracker application, its
              developers, or contributors be liable for any direct, indirect,
              incidental, special, or consequential damages arising from the use
              of this service.
            </p>
            <p className="text-gray-700">
              You use this service at your own risk and discretion. Any
              decisions made based on the information provided are your sole
              responsibility.
            </p>
          </section>

          <section id="usage" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Acceptable Use
            </h2>
            <p className="text-gray-700 mb-4">
              You may use this service for personal, non-commercial purposes.
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>
                Use the service for any unlawful purpose or in violation of any
                local, state, national, or international law
              </li>
              <li>
                Attempt to gain unauthorized access to our systems or networks
              </li>
              <li>
                Use automated scripts or bots to access the service excessively
              </li>
              <li>
                Redistribute or republish the data without proper attribution
              </li>
              <li>
                Use the service in a way that could damage, disable, overburden,
                or impair our systems
              </li>
            </ul>
          </section>

          <section id="privacy" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Privacy and Data Handling
            </h2>
            <p className="text-gray-700 mb-4">
              This application stores data locally in your browser and does not
              collect personal information. For detailed information about data
              handling, please see our{" "}
              <Link
                href="/privacy"
                className="text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                Privacy Policy
              </Link>
              .
            </p>
            <p className="text-gray-700">
              We respect your privacy and are committed to protecting any
              information that may be stored locally on your device.
            </p>
          </section>

          <section id="changes" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Changes to Terms
            </h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these terms at any time. Changes
              will be effective immediately upon posting to this page.
            </p>
            <p className="text-gray-700">
              Your continued use of the service after any changes constitutes
              acceptance of the new terms.
            </p>
          </section>

          <section id="contact" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Contact Information
            </h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms of Use, please contact
              us through the project repository or create an issue on our GitHub
              page.
            </p>
            <p className="text-gray-700">
              For official immigration information, always contact{" "}
              <a
                href="https://www.canada.ca/en/immigration-refugees-citizenship.html"
                className="text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                target="_blank"
                rel="noopener noreferrer"
              >
                Immigration, Refugees and Citizenship Canada (IRCC)
              </a>
              .
            </p>
          </section>
        </main>

        {/* Footer navigation */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <Link
              href="/"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Return to Express Entry Tracker
            </Link>
            <div className="flex items-center space-x-4 text-sm">
              <Link
                href="/privacy"
                className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
              >
                Privacy Policy
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
