import React from 'react';
import { ArrowLeft, ExternalLink, Lock, Server, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import KriptoAmanLogo from '../components/brand/KriptoAmanLogo';

function Section({ title, children }) {
  return <section className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5"><h2 className="mb-3 font-bold text-white">{title}</h2><div className="space-y-2 text-sm leading-relaxed text-slate-300">{children}</div></section>;
}

export default function RPCPrivacyPolicy() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 pb-24 pt-6 text-white">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center gap-3">
          <Link to="/KAMNetwork" className="rounded-lg bg-slate-800 p-2 hover:bg-slate-700" aria-label="Back to KAM Network"><ArrowLeft className="h-4 w-4 text-slate-300" /></Link>
          <KriptoAmanLogo size={36} showText textSize="text-base" />
        </div>

        <header className="pb-3">
          <div className="flex items-center gap-3"><div className="rounded-xl border border-sky-500/30 bg-sky-500/20 p-2"><Lock className="h-5 w-5 text-sky-300" /></div><h1 className="text-2xl font-bold">KAM Public RPC Privacy Policy</h1></div>
          <p className="mt-2 text-sm text-slate-400">PT Kripto Aman Indonesia · Effective: 26 August 2026</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">This policy describes privacy and operational practices for the public JSON-RPC endpoint at <strong>https://rpc.kriptoaman.com</strong>. The endpoint is provided for read-oriented access to the KAM network candidate and does not require users to submit seed phrases or private keys.</p>
        </header>

        <Section title="1. Data processed by the RPC gateway">
          <p>When a device connects to the public RPC endpoint, standard internet infrastructure may process technical metadata such as IP address, request time, HTTP headers, user-agent, request size, response status, latency, and abuse/rate-limit signals.</p>
          <p>JSON-RPC method names and public blockchain parameters may be processed to route requests, enforce method allowlists, protect availability, investigate errors, and prevent abuse.</p>
          <p>The public RPC service is not designed to collect account passwords, seed phrases, private keys, identity documents, or wallet recovery secrets.</p>
        </Section>

        <Section title="2. Purpose and legal/operational basis">
          <p>Technical metadata is used only as reasonably necessary to provide the RPC service, maintain security, detect abuse, troubleshoot reliability, enforce rate limits, and protect the network gateway and users.</p>
          <p>KriptoAman does not sell RPC access logs or personal information derived from RPC requests.</p>
        </Section>

        <Section title="3. Infrastructure providers and transfers">
          <div className="flex gap-2"><Server className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" /><p>The RPC endpoint may use hosting, DNS, content-delivery, security, and observability providers. Those providers may process standard network metadata as part of delivering and protecting the service.</p></div>
          <p>Where third-party infrastructure is used, processing is limited to what is necessary for service delivery, security, reliability, and applicable legal obligations.</p>
        </Section>

        <Section title="4. Security and method restrictions">
          <div className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /><p>The public gateway is intended to expose a restricted, read-oriented JSON-RPC surface. Administrative, personal, debug, QBFT management, and other sensitive node-management namespaces are not intended to be publicly available.</p></div>
          <p>HTTPS/TLS, gateway controls, rate limits, request-size controls, and method restrictions may be used to reduce abuse and exposure. No internet service can guarantee absolute security or availability.</p>
        </Section>

        <Section title="5. Retention">
          <p>Operational and security logs may be retained for a limited period appropriate to reliability, incident response, abuse prevention, troubleshooting, and legal obligations. Retention may vary by infrastructure provider and log category.</p>
          <p>KriptoAman aims to avoid retaining RPC metadata longer than reasonably necessary for these purposes.</p>
        </Section>

        <Section title="6. Public blockchain data">
          <p>Blockchain data returned by the RPC endpoint is public network data. Transactions and addresses recorded on a blockchain may remain publicly visible independently of KriptoAman and cannot generally be deleted by the RPC provider.</p>
        </Section>

        <Section title="7. Contact and related policies">
          <p>Privacy questions may be sent to <strong>privacy@kriptoaman.com</strong>.</p>
          <div className="flex flex-wrap gap-3 pt-1"><Link to="/PrivacyPolicy" className="inline-flex items-center gap-1 text-sky-300">General Privacy Policy <ExternalLink className="h-3 w-3" /></Link><Link to="/KAMNetworkDocs" className="inline-flex items-center gap-1 text-sky-300">KAM Network Documentation <ExternalLink className="h-3 w-3" /></Link></div>
        </Section>

        <p className="pt-4 text-center text-xs text-slate-500">© 2026 PT Kripto Aman Indonesia.</p>
      </div>
    </main>
  );
}
