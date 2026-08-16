import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | PPC Keyword Utilities Suite",
  description:
    "How the PPC Keyword Utilities Suite handles your data: keyword lists and uploaded reports are processed entirely in your browser and are never transmitted.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updatedOn="16 August 2026"
      summary={
        <>
          <p>
            Keyword lists and search-terms reports you paste or upload are
            processed entirely inside your browser tab. They are never
            transmitted to us or to anyone else, because these tools have no
            server-side component to transmit them to.
          </p>
          <p>
            There are no accounts, no cookies, and nothing written to browser
            storage.
          </p>
        </>
      }
    >
      <LegalSection heading="What happens to the lists you paste or upload">
        <p>
          All three tools run as client-side JavaScript. When you paste a
          keyword list, drop in a .csv or .xlsx search-terms report, or tick a
          formatting option, the parsing, merging, tokenising and formatting all
          happen on your own device - on a Web Worker when a list is large
          enough to be worth moving off the main thread.
        </p>
        <p>
          The result is that your lists never enter a network request. Closing
          or reloading the tab discards them: nothing is cached, queued, or
          written anywhere for later.
        </p>
      </LegalSection>

      <LegalSection heading="What is not collected">
        <p>
          No accounts, sign-ups, or email addresses. No cookies. Nothing written
          to <span className="font-mono text-ink">localStorage</span> or{" "}
          <span className="font-mono text-ink">sessionStorage</span>. No
          advertising or cross-site tracking pixels, and no third-party scripts
          that would set any of the above on our behalf.
        </p>
        <p>
          Because no cookies or comparable storage are used, there is no consent
          banner to click through.
        </p>
      </LegalSection>

      <LegalSection heading="Usage measurement">
        <p>
          The suite includes an internal event module for measuring which tools
          get used. It is currently not connected to any analytics provider, so
          in the published site these events are recorded nowhere.
        </p>
        <p>
          If a provider is connected later, the events it can send are fixed in
          advance and consist only of a tool name, a coarse size bucket such as{" "}
          <span className="font-mono text-ink">101-1000</span>, the names of the
          options you ticked, and an error category. There is no field capable
          of carrying keyword text, file contents, or file names - that
          constraint is enforced by the event type definitions themselves rather
          than by convention, so it holds for any code added later. This page
          will be updated before any such provider goes live.
        </p>
      </LegalSection>

      <LegalSection heading="What the web host can see">
        <p>
          These pages are served as static files by a hosting provider. Like any
          web server, that provider records ordinary request logs - IP address,
          timestamp, requested URL, browser user-agent - for delivery and abuse
          prevention. Those logs cover the request for the page itself. They
          cannot contain your keyword data, because your keyword data is never
          part of a request.
        </p>
      </LegalSection>

      <LegalSection heading="Links to other sites">
        <p>
          The footer links to{" "}
          <a
            href="https://app.ppcexpert.pro/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-signal underline underline-offset-2 transition-colors duration-200 ease-out hover:text-signal-strong"
          >
            PPC Expert
          </a>
          , which is a separate site with its own privacy practices. This policy
          covers only the tools hosted here.
        </p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>
          Any change to how data is handled will be reflected here along with a
          new date at the top of this page. Material changes - in particular,
          connecting an analytics provider - will be described rather than
          folded quietly into the text.
        </p>
      </LegalSection>

      <LegalSection heading="Questions">
        <p>
          Reach out through{" "}
          <a
            href="https://app.ppcexpert.pro/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-signal underline underline-offset-2 transition-colors duration-200 ease-out hover:text-signal-strong"
          >
            PPC Expert
          </a>
          , who maintain this suite. The{" "}
          <Link
            href="/terms"
            className="font-medium text-signal underline underline-offset-2 transition-colors duration-200 ease-out hover:text-signal-strong"
          >
            terms of use
          </Link>{" "}
          cover what the tools do and do not promise.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
