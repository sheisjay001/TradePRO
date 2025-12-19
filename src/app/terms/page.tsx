export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Terms of Service</h1>
      
      <div className="prose prose-slate max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">1. Acceptance of Terms</h2>
          <p className="text-slate-600 mb-4">
            By accessing and using TradeSignal Pro ("the Service"), you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">2. Trading Risk Disclaimer</h2>
          <p className="text-slate-600 mb-4">
            Trading financial markets (Forex, Crypto, Indices) involves a high level of risk and may not be suitable for all investors. You could lose some or all of your initial investment.
          </p>
          <p className="text-slate-600 mb-4 font-medium">
            The signals provided by TradeSignal Pro are for educational and informational purposes only and should not be considered as financial advice. We are not responsible for any losses incurred while using our signals.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">3. Account Security</h2>
          <p className="text-slate-600 mb-4">
            You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">4. Subscription and Payments</h2>
          <p className="text-slate-600 mb-4">
            Some features of the Service may require a paid subscription. All payments are non-refundable unless otherwise stated by law. We reserve the right to change our pricing at any time.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">5. Termination</h2>
          <p className="text-slate-600 mb-4">
            We reserve the right to terminate or suspend your account at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
          </p>
        </section>
      </div>
    </div>
  )
}
