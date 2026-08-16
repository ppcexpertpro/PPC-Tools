import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use | PPC Keyword Utilities Suite",
  description:
    "Terms of use for the PPC Keyword Utilities Suite: free browser-based keyword tools provided as-is, with no affiliation to Google or Microsoft.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      updatedOn="16 August 2026"
      summary={
        <>
          <p>
            These tools are free to use for any purpose, including client work,
            with no account and no attribution required.
          </p>
          <p>
            They are provided as-is. Check the output before you push it into a
            live account, and note that this suite is not affiliated with Google
            or Microsoft.
          </p>
        </>
      }
    >
      <LegalSection heading="Using the tools">
        <p>
          The PPC Keyword Utilities Suite is free, requires no account, and
          carries no usage limit beyond the practical ones each tool states on
          its own page. Output you generate is yours - there is no licence to
          accept and no attribution to give, whether you are working on your own
          campaigns or a client&apos;s.
        </p>
        <p>
          The one thing asked in return is that you do not try to break the
          service for other people: no attempts to disrupt or overload the
          hosting, and no republishing the suite as your own product.
        </p>
      </LegalSection>

      <LegalSection heading="No warranty">
        <p>
          Keyword formatting, merging, and frequency analysis are provided
          without warranty of any kind. Match-type syntax, character limits, and
          platform behaviour change over time, and a formatted list that was
          valid last quarter may not be today.
        </p>
        <p>
          Review output before importing it into a live account. Uploading a
          keyword list changes what your ads compete for and what you spend, and
          that judgement stays with you.
        </p>
      </LegalSection>

      <LegalSection heading="Limitation of liability">
        <p>
          To the fullest extent permitted by law, the maintainers of this suite
          are not liable for advertising spend, lost revenue, campaign
          performance, or any other loss arising from your use of these tools or
          of the output they produce.
        </p>
      </LegalSection>

      <LegalSection heading="Trademarks and affiliation">
        <p>
          This suite is an independent project. It is not affiliated with,
          endorsed by, or sponsored by Google LLC or Microsoft Corporation.
          Google Ads, Google Ads Editor, and Microsoft Advertising are
          trademarks of their respective owners, referenced here only to
          describe what the output is compatible with.
        </p>
        <p>
          The tools are built against publicly documented match-type conventions
          and do not connect to any advertising platform API.
        </p>
      </LegalSection>

      <LegalSection heading="Availability">
        <p>
          These are static pages with no server-side processing, so they are
          about as available as web hosting gets - but no uptime is guaranteed,
          and tools may be changed or withdrawn without notice.
        </p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>
          Updated terms take effect when posted, with a new date at the top of
          this page. How your data is handled is covered separately in the{" "}
          <Link
            href="/privacy"
            className="font-medium text-signal underline underline-offset-2 transition-colors duration-200 ease-out hover:text-signal-strong"
          >
            privacy policy
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
