export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 pt-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-slate-400 mb-8">Last updated: March 1, 2026</p>

        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
            <p className="text-slate-300 leading-relaxed">
              COINVAULT ("we," "us," "our," or "Company") operates a cryptocurrency wallet and trading platform. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information.
            </p>
            <p className="text-slate-300 leading-relaxed">
              We are committed to protecting your privacy and ensuring you have a positive experience on our platform. 
              If you have any questions about this Privacy Policy, please contact us at support@coinvault.app.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-semibold text-slate-200 mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li>Account registration data (email, password, full name)</li>
              <li>Wallet information (addresses, but NOT private keys)</li>
              <li>Transaction history</li>
              <li>User preferences and settings</li>
              <li>Support communications</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-200 mb-3 mt-4">2.2 Automatically Collected Information</h3>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li>Device information (model, OS, browser)</li>
              <li>IP address and location data (if permitted)</li>
              <li>Usage patterns and analytics</li>
              <li>Cookies and local storage data</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-200 mb-3 mt-4">2.3 What We Don't Store</h3>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li>Private keys or seed phrases</li>
              <li>Unencrypted sensitive credentials</li>
              <li>Full credit card numbers</li>
              <li>Government identification documents (unless verified)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li>Provide and improve our services</li>
              <li>Process transactions and respond to requests</li>
              <li>Send transactional and promotional emails</li>
              <li>Detect and prevent fraud/illegal activity</li>
              <li>Comply with legal obligations</li>
              <li>Analyze usage patterns for optimization</li>
              <li>Provide customer support</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
            <p className="text-slate-300 leading-relaxed">
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300 mt-2">
              <li>End-to-end encryption for sensitive data</li>
              <li>HTTPS/TLS for all connections</li>
              <li>Regular security audits</li>
              <li>Multi-factor authentication support</li>
              <li>Hardware security module storage (for keys)</li>
              <li>Compliance with industry standards (SOC 2, GDPR)</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              However, no method of transmission or storage is 100% secure. While we strive to protect your data, 
              we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Data Sharing</h2>
            <p className="text-slate-300 leading-relaxed mb-2">We share data only with:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li>Service providers under strict confidentiality agreements</li>
              <li>Law enforcement if legally required</li>
              <li>Third parties you explicitly authorize</li>
              <li>Blockchain networks (transaction data is public)</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              We do NOT sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights (GDPR & CCPA)</h2>
            <p className="text-slate-300 leading-relaxed">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-300 mt-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your data (right to be forgotten)</li>
              <li>Restrict processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              To exercise these rights, contact us at privacy@coinvault.app
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Cookies & Tracking</h2>
            <p className="text-slate-300 leading-relaxed">
              We use cookies and similar technologies for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300 mt-2">
              <li>Session management</li>
              <li>User authentication</li>
              <li>Analytics (Mixpanel)</li>
              <li>Fraud prevention</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              You can manage cookie preferences in your browser settings. Note that disabling cookies may affect functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Children's Privacy</h2>
            <p className="text-slate-300 leading-relaxed">
              Our service is not intended for users under 18 years old. We do not knowingly collect information from minors. 
              If we become aware that a child has provided information, we will delete it immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. International Transfers</h2>
            <p className="text-slate-300 leading-relaxed">
              Your information may be transferred to countries outside your residence, which may have different data protection laws. 
              By using our service, you consent to such transfers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Third-Party Links</h2>
            <p className="text-slate-300 leading-relaxed">
              Our platform may contain links to third-party services. This Privacy Policy does not apply to external sites, 
              and we are not responsible for their privacy practices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. Changes to This Policy</h2>
            <p className="text-slate-300 leading-relaxed">
              We may update this Privacy Policy periodically. Material changes will be notified to you via email or 
              through a prominent notice on our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">12. Contact Us</h2>
            <p className="text-slate-300 leading-relaxed">
              If you have questions about this Privacy Policy or our privacy practices:
            </p>
            <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
              <p className="text-slate-300"><strong>Email:</strong> privacy@coinvault.app</p>
              <p className="text-slate-300 mt-2"><strong>Mail:</strong> COINVAULT Support, Address TBD</p>
              <p className="text-slate-300 mt-2"><strong>Response Time:</strong> Within 30 days</p>
            </div>
          </section>
        </div>

        <div className="mt-12 py-8 border-t border-slate-700/50">
          <p className="text-slate-500 text-sm text-center">
            © 2026 COINVAULT. All rights reserved. | 
            <a href="/terms-of-service" className="text-blue-400 hover:underline ml-1">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  );
}