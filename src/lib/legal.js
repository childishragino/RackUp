/* ------------------------------------------------------------------ */
/*  RackUp legal documents.                                            */
/*                                                                     */
/*  IMPORTANT: bump LEGAL_VERSION whenever the substance of either     */
/*  document changes. The signup flow records the accepted version     */
/*  against each user, so the stored value is only meaningful if this  */
/*  constant actually tracks revisions.                                */
/* ------------------------------------------------------------------ */

export const LEGAL_VERSION = "1.0";
export const LEGAL_EFFECTIVE = "6 August 2026";

/** Role address — set up free email forwarding in Namecheap so this reaches you. */
export const CONTACT_EMAIL = "privacy@rackup.monster";

export const OPERATOR = "the operator of RackUp";
export const JURISDICTION = "the Province of Ontario, Canada";

export const TERMS = {
  title: "Terms of Service",
  sections: [
    {
      h: "1. Agreement",
      p: [
        `By creating an account or using RackUp ("the Service"), you agree to these Terms of Service and to the Privacy Policy. If you do not agree, do not create an account or use the Service.`,
        `RackUp is a personal-fitness logging tool operated by ${OPERATOR}. It is provided free of charge and is offered on an "as is" basis.`,
      ],
    },
    {
      h: "2. Eligibility",
      p: [
        `You must be at least 16 years old to use RackUp. By creating an account you confirm that you are 16 or older. If you are under 16, do not use the Service.`,
        `You are responsible for anything that happens under your account, including keeping access to your email secure, since sign-in codes are sent there.`,
      ],
    },
    {
      h: "3. Health and safety — please read this section",
      isImportant: true,
      p: [
        `RackUp is a record-keeping tool. It is NOT a medical device, and it does not provide medical advice, diagnosis, or treatment. Nothing in the Service — including personal records, heart-rate data, volume totals, charts, or any other output — should be interpreted as medical or professional guidance.`,
        `Consult a qualified physician before beginning any exercise programme, particularly if you have a heart condition, are pregnant, are recovering from injury or surgery, take medication, or have any other condition that exercise could affect.`,
        `Physical exercise carries inherent risks, including muscle strain, joint injury, serious bodily harm, cardiac events, and in rare cases death. These risks exist whether or not you use RackUp. By using the Service you acknowledge those risks and accept them voluntarily. You are solely responsible for the exercises you choose, the loads you lift, and your own technique and limits.`,
        `Heart-rate and other health figures shown in RackUp are imported from third-party sources such as Apple Health and may be inaccurate, delayed, incomplete, or missing entirely. Never rely on RackUp to detect, monitor, or respond to a medical condition or emergency. If you feel unwell while exercising, stop immediately and seek medical attention. If you believe you are having a medical emergency, call your local emergency number.`,
        `To the fullest extent permitted by law, you release ${OPERATOR} from all claims arising out of injury, illness, or loss connected to your exercise activity, whether or not that activity was logged in RackUp.`,
      ],
    },
    {
      h: "4. Your data and content",
      p: [
        `The workout data you enter remains yours. You grant ${OPERATOR} only the permission needed to store, process, and display it back to you so the Service can function.`,
        `You may export or delete your data at any time from within the app. Deleting your account removes your workout, session, and health records from the live database.`,
        `Do not upload content that is unlawful, infringing, or that contains another person's personal information without their consent.`,
      ],
    },
    {
      h: "5. Acceptable use",
      p: [
        `Do not attempt to access accounts or data belonging to other users, probe or circumvent the Service's security, disrupt its operation, scrape it, resell it, or use it to build a competing product. Do not use automated systems to create accounts.`,
        `${OPERATOR} may suspend or terminate any account that violates these Terms, or that creates risk or legal exposure, without notice.`,
      ],
    },
    {
      h: "6. Availability, changes, and discontinuation",
      p: [
        `RackUp is a personal project offered free of charge. There is no uptime guarantee, no service-level commitment, and no guarantee that data will be preserved. Features may change or be removed at any time.`,
        `The Service may be suspended or discontinued entirely, at any time and without notice. You are strongly encouraged to keep your own backups of anything you would be upset to lose.`,
      ],
    },
    {
      h: "7. Disclaimer of warranties",
      p: [
        `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, AND NON-INFRINGEMENT.`,
        `${OPERATOR} does not warrant that the Service will be uninterrupted, secure, error-free, or that data will not be lost or corrupted.`,
      ],
    },
    {
      h: "8. Limitation of liability",
      p: [
        `TO THE FULLEST EXTENT PERMITTED BY LAW, ${OPERATOR.toUpperCase()} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF DATA, PROFITS, REVENUE, OR GOODWILL, ARISING OUT OF OR RELATING TO YOUR USE OF OR INABILITY TO USE THE SERVICE.`,
        `TOTAL AGGREGATE LIABILITY FOR ANY CLAIM RELATING TO THE SERVICE SHALL NOT EXCEED ONE HUNDRED CANADIAN DOLLARS (CAD $100).`,
        `Some jurisdictions do not allow certain limitations of liability or exclusions of warranty, so parts of the two sections above may not apply to you. Nothing in these Terms limits liability that cannot lawfully be limited, including liability for fraud or for death or personal injury caused by proven negligence.`,
      ],
    },
    {
      h: "9. Indemnity",
      p: [
        `You agree to indemnify and hold harmless ${OPERATOR} from any claim, demand, loss, or expense (including reasonable legal fees) arising from your use of the Service, your content, or your breach of these Terms.`,
      ],
    },
    {
      h: "10. Termination",
      p: [
        `You may stop using RackUp and delete your account at any time. ${OPERATOR} may terminate or suspend access at any time. Sections 3, 7, 8, and 9 survive termination.`,
      ],
    },
    {
      h: "11. Governing law",
      p: [
        `These Terms are governed by the laws of ${JURISDICTION}, without regard to conflict-of-law rules. The courts of that jurisdiction have exclusive jurisdiction, except where mandatory consumer-protection law in your country of residence gives you the right to bring proceedings locally.`,
      ],
    },
    {
      h: "12. Changes to these Terms",
      p: [
        `These Terms may be updated from time to time. Material changes will be signalled by an updated effective date and, where the change is significant, by asking you to accept the revised Terms on your next sign-in. Continued use after an update constitutes acceptance.`,
      ],
    },
    {
      h: "13. Contact",
      p: [`Questions about these Terms: ${CONTACT_EMAIL}`],
    },
  ],
};

export const PRIVACY = {
  title: "Privacy Policy",
  sections: [
    {
      h: "1. Overview",
      p: [
        `This policy explains what personal information RackUp collects, why, and what rights you have over it. RackUp is operated by ${OPERATOR}, based in ${JURISDICTION}.`,
        `RackUp handles health and fitness information, which is sensitive personal information. It is collected only with your consent and used only to provide the Service to you. It is never sold.`,
      ],
    },
    {
      h: "2. What is collected",
      p: [
        `Account information — your email address. This is used to sign you in (via a one-time code) and to contact you about the Service. No password is stored, because RackUp does not use passwords.`,
        `Workout data — routines, exercise names, weights, repetitions, notes you write, session timing, personal records, and derived totals.`,
        `Health data (optional) — if you choose to set up the Apple Health export integration, RackUp receives heart-rate, step, distance, and active-energy samples exported from your device. This integration is entirely optional and off unless you generate a token and configure it yourself.`,
        `Technical data — standard server and hosting logs kept by our infrastructure providers, which may include IP address, browser type, and timestamps. These are used for security and reliability.`,
        `RackUp does not use advertising trackers, third-party analytics, or behavioural profiling.`,
      ],
    },
    {
      h: "3. Why it is collected, and the legal basis",
      p: [
        `Your data is used solely to operate the Service: to store and display your logs, calculate records and totals, render progress charts, and authenticate you.`,
        `Where the GDPR or similar law applies, the legal bases are: your consent (for health data specifically), and the performance of a contract with you (to provide the Service you signed up for). You may withdraw consent at any time by deleting your account.`,
      ],
    },
    {
      h: "4. Who your data is shared with",
      p: [
        `Your data is not sold, rented, or shared for marketing. It is processed by a small number of infrastructure providers acting on our behalf:`,
        `• Supabase — database, authentication, and storage of your account and workout data.`,
        `• Vercel — application hosting and the health-import endpoint.`,
        `• Resend — delivery of sign-in code emails (receives your email address only).`,
        `Data may also be disclosed where required by law, or where necessary to investigate a security incident or protect the rights and safety of users.`,
      ],
    },
    {
      h: "5. Where your data is stored",
      p: [
        `Data is stored on servers operated by the providers named above, which may be located outside your country of residence, including in the United States. Where required, transfers rely on the providers' standard contractual clauses and equivalent safeguards. By using the Service you acknowledge this cross-border processing.`,
      ],
    },
    {
      h: "6. Security",
      p: [
        `Access to your data is enforced at the database level: every table carries row-level security policies restricting rows to the account that owns them, so one user's credentials cannot reach another user's data. Traffic is encrypted in transit. Sign-in uses one-time codes rather than stored passwords. The optional health-import token is stored only as a cryptographic hash.`,
        `No system is perfectly secure, and no absolute guarantee is given. In the event of a breach affecting your personal information, you will be notified, and the relevant privacy regulator informed, as required by applicable law.`,
      ],
    },
    {
      h: "7. Retention",
      p: [
        `Your data is retained while your account is active. When you delete your account, your workout, session, and health records are deleted from the live database. Residual copies may persist in encrypted infrastructure backups for a limited period before being overwritten in the ordinary course.`,
      ],
    },
    {
      h: "8. Your rights",
      p: [
        `Subject to applicable law — including PIPEDA in Canada and the GDPR in the European Economic Area and the UK — you have the right to access the personal information held about you, to correct it, to delete it, to obtain a portable copy, to withdraw consent, and to complain to a privacy regulator.`,
        `Most of these can be exercised directly in the app: your data is visible to you at all times, exportable, and deletable. For anything else, contact ${CONTACT_EMAIL} and expect a response within 30 days.`,
        `In Canada you may also complain to the Office of the Privacy Commissioner of Canada. In the EEA or UK, you may complain to your local supervisory authority.`,
      ],
    },
    {
      h: "9. Children",
      p: [
        `RackUp is not intended for anyone under 16, and accounts are not knowingly created for them. If you believe a child under 16 has provided personal information, contact ${CONTACT_EMAIL} and it will be deleted.`,
      ],
    },
    {
      h: "10. Changes to this policy",
      p: [
        `This policy may be updated. Material changes will be signalled by an updated effective date and, where significant, by asking you to review the revised policy on your next sign-in.`,
      ],
    },
    {
      h: "11. Contact",
      p: [`Privacy questions, requests, or complaints: ${CONTACT_EMAIL}`],
    },
  ],
};
