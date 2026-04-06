import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Terms of service — Joseck VPS Manager",
  description: "Terms and conditions for the VPS management service",
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full px-6 py-8 text-left lg:px-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Joseck</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              Terms of service
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/login">Sign in</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>

        <article className="w-full max-w-none space-y-8 text-sm leading-relaxed text-foreground">
          <p className="text-xs text-muted-foreground">
            Last updated: March 31, 2026. This document is a template for guidance only; consult legal
            counsel before relying on it as a binding contract.
          </p>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">1. Service description</h2>
            <p className="text-muted-foreground">
              The service commercially known as <strong className="text-foreground">Joseck VPS Manager </strong> (the
              &quot;Service&quot;) consists of a web platform and related components that let you monitor and send
              instructions to virtual or physical machines on which you have voluntarily installed the
              agent software provided by the party operating the Service (the &quot;Operator&quot;).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">2. Acceptance</h2>
            <p className="text-muted-foreground">
              By creating an account, accessing the dashboard, or using the agent on your systems, you
              represent that you have read and agree to these Terms. If you do not agree, you must not use
              the Service or install the agent.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">3. Account and eligibility</h2>
            <p className="text-muted-foreground">
              You are responsible for keeping your dashboard credentials confidential. You must provide
              accurate information and keep contact details up to date when the Operator requests them to
              deliver the Service. The Operator may suspend or terminate accounts that violate these Terms
              or applicable law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">4. Agent and control panel</h2>
            <p className="text-muted-foreground">
              The <strong className="text-foreground">agent</strong> is software that runs on your infrastructure and communicates with
              the Operator&apos;s servers. The <strong className="text-foreground">dashboard</strong> lets you view status, metrics, and,
              depending on product configuration, send remote commands.
            </p>
            <p className="text-muted-foreground">
              In some setups, performing sensitive actions on a host may require you to configure a{" "}
              <strong className="text-foreground">local secret</strong> on the server where the agent runs, matching the value you enter
              in the dashboard. This adds assurance that only someone with the secret can authorize those
              operations. The Operator does not assume your obligation to safeguard that secret or to secure
              your systems.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">5. Acceptable use</h2>
            <p className="text-muted-foreground">
              You agree to use the Service only for lawful purposes and in compliance with applicable
              regulations (including data protection and third-party intellectual property). You may not
              use the Service to compromise third-party systems, mine cryptocurrency without authorization,
              distribute malware, engage in fraud, or behave in any way the Operator reasonably deems
              abusive. The Operator may investigate misuse and cooperate with authorities when appropriate.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">6. Intellectual property</h2>
            <p className="text-muted-foreground">
              Dashboard software, documentation, and trademarks associated with the Service are owned by
              the Operator or its licensors. You are not granted ownership; only a limited license to use
              them as needed to use the Service as offered.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">7. Availability and limitation of liability</h2>
            <p className="text-muted-foreground">
              The Service is provided <strong className="text-foreground">&quot;as is&quot;</strong> and{" "}
              <strong className="text-foreground">&quot;as available&quot;</strong>. The Operator does not warrant uninterrupted
              availability, error-free operation, or compatibility of the agent with every environment. To
              the fullest extent permitted by law, the Operator will not be liable for indirect damages,
              lost profits, data loss, or business interruption arising from use or inability to use the
              Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">8. Privacy and data</h2>
            <p className="text-muted-foreground">
              Processing of personal data and data produced by the agent (for example machine identifiers,
              metrics, or screenshots if applicable) is governed by the Operator&apos;s privacy policy and
              applicable law. You are responsible for informing your own end users where required and for
              having a lawful basis to process data on your systems.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">9. Changes</h2>
            <p className="text-muted-foreground">
              The Operator may update these Terms by publishing a revised version at this URL or another
              URL indicated in the Service. Continued use after notice or publication may constitute
              acceptance of the changes where allowed by applicable law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">10. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these Terms, contact:{" "}
              <a
                className="text-accent underline-offset-4 hover:underline"
                href="mailto:joseck14.business@gmail.com"
              >
                joseck14.business@gmail.com
              </a>{" "}
            </p>
          </section>
        </article>
      </div>
    </div>
  )
}
