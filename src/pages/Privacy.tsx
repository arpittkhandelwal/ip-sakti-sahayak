export function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
      <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
        <section>
          <h2 className="text-lg font-semibold mb-2">Data Collection</h2>
          <p>IP-SAKTI Sahayak does not collect, store, or transmit any personally identifiable information (PII). Queries are processed server-side and are not stored in any persistent database.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">Audit Logging</h2>
          <p>An anonymized audit log is maintained in server memory only (not persisted to disk or database). Each entry contains: a one-way hash of the query (SHA-256, first 16 characters), timestamp, detected language, jurisdiction, IP type classification, source document IDs, and confidence level. No query text is stored.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">Third-Party Processing</h2>
          <p>Your queries are processed by Sarvam AI (api.sarvam.ai) for language detection, translation, and answer generation. Please review Sarvam AI's privacy policy at <a href="https://sarvam.ai" className="text-saffron-500 hover:underline" target="_blank" rel="noopener noreferrer">sarvam.ai</a>.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">DPDP Act 2023 Compliance</h2>
          <p>This system is designed in alignment with the Digital Personal Data Protection Act, 2023 (India). No personal data is processed or retained. This tool is for informational purposes only.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">Cookies</h2>
          <p>No cookies are used. UI preferences (dark mode, language) are stored in browser memory only and are cleared on page refresh.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">Contact</h2>
          <p>For privacy concerns, contact: <a href="mailto:privacy@aiia.res.in" className="text-saffron-500 hover:underline">privacy@aiia.res.in</a></p>
        </section>
      </div>
    </div>
  );
}

