import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | PPC Keyword Utilities Suite",
  description:
    "How the PPC Keyword Utilities Suite handles your data: keyword lists and uploaded reports are processed entirely in your browser and are never transmitted. The outreach tool works differently - see how.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updatedOn="4 September 2026"
      summary={
        <>
          <p>
            Keyword lists and search-terms reports you paste or upload into
            the three keyword tools - Match Type, Merge & Match, Negative
            Keyword Finder - are processed entirely inside your browser tab
            and never transmitted anywhere.
          </p>
          <p>
            The outreach tool works differently: it has a server, because
            sending email requires one. See{" "}
            <a
              href="#outreach-tool"
              className="font-medium text-signal underline underline-offset-2 transition-colors duration-200 ease-out hover:text-signal-strong"
            >
              how the outreach tool handles data
            </a>{" "}
            below.
          </p>
          <p>
            There are no accounts, no cookies, and nothing written to browser
            storage, in either case.
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

      <LegalSection heading="The outreach tool works differently">
        <p id="outreach-tool">
          The outreach tool connects to a mailbox you control and sends
          messages to contacts you upload. Unlike the three keyword tools,
          this requires a server: your mailbox credentials, the contacts you
          import, and the content and delivery status of each message are
          stored in this application&apos;s own database, not processed
          transiently in your browser.
        </p>
        <p>
          Mailbox credentials are encrypted at rest and are never included in
          any API response the browser receives. Contact data and message
          history are kept only as long as you keep them in the tool, are
          never sold or shared with anyone else, and are used solely to run
          the campaigns you create.
        </p>
        <p>
          Running a cold-outreach campaign is your responsibility, not the
          tool&apos;s: you must have a lawful basis to email the contacts you
          upload. The tool enforces baseline compliance - a working
          unsubscribe link and a visible postal address on every message -
          but it cannot verify where your contact list came from or whether
          you have the right to email it.
        </p>
      </LegalSection>

      <LegalSection heading="What is not collected">
        <p>
          For the three keyword tools: no accounts, sign-ups, or email
          addresses. The outreach tool is the one exception, by necessity -
          running it means giving it the contact email addresses you intend
          to send to, and the mailbox credentials to send from. No cookies
          anywhere on this site. Nothing written to{" "}
          <span className="font-mono text-ink">localStorage</span> or{" "}
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
