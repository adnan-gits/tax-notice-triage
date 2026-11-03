// 12 SYNTHETIC test cases. Every name, PAN, SSN, EIN, TAN, amount and document below is made up.
//
// What is canned vs live in the mock:
//   - `items` (notice extraction) and `records` (taxpayer-document extraction) stand in for LLM
//     structured-output calls. Each carries a source span {doc, line}.
//   - `causes` stand in for the LLM's cause-classification proposals.
//   - `draft` stands in for the LLM's grounded draft.
//   - Validation, reconciliation, rule checks, citation checks and amount tracing are computed
//     live in index.html from this data. Nothing below is computed in advance.
//
// record.kind: third_party (AIS / 1099 copy) | return (filed return) | bank | other | tds_credit | prior_year_return
// cause.amountFrom: records whose amounts explain the variance. cause.support: supporting evidence only.
// cause.remainder: "the rest of the variance". Only allowed for labels with remainderAllowed.

const IN_HEAD = "INCOME TAX DEPARTMENT · CPC: Communication u/s 143(1)(a) (SYNTHETIC)";
const IN_TBL = "Sl | Head | Source | As per AIS | As per ITR | Variance";
const US_HEAD = "DEPARTMENT OF THE TREASURY · INTERNAL REVENUE SERVICE: Notice CP2000 (SYNTHETIC)";
const US_TBL = "Payer | Form | Income type | Reported by payer | Shown on return | Difference";

window.CASES = [
  // ───────────────────────────── INDIA ─────────────────────────────
  {
    id: "IN-01", j: "IN", title: "FD interest counted twice in AIS",
    notice: { type: "s.143(1)(a) proposed adjustment", year: 2025, yearText: "AY 2025-26", issued: "2026-10-06", statedTotal: 42000, totalSrc: "notice:7" },
    docs: {
      notice: { name: "Notice", lines: [IN_HEAD, "PAN: AB***34K · Assessment Year 2025-26 · Ref CPC/2526/A1/0000101", "Date of issue: 06-Oct-2026 · Response due within 30 days", "Nature of variance: income per AIS/26AS not fully offered in return", IN_TBL, "1 | Other sources: interest on deposits | Konkan Bank (TAN MUMK00001A) | 84,000 | 42,000 | 42,000", "Total variance proposed to be added: 42,000", "Tax and interest on the addition will be computed on processing."] },
      ais: { name: "AIS FY24-25", lines: ["ANNUAL INFORMATION STATEMENT: FY 2024-25 (SYNTHETIC)", "Part B1 · TDS/TCS information", "TDS-194A | Konkan Bank | Interest other than on securities | Credited 42,000 | TDS 4,200", "Part B2 · SFT information", "SFT-005 | Konkan Bank | Interest on time deposits | 42,000", "Part B3 · Other information: none"] },
      bank: { name: "Interest cert.", lines: ["KONKAN BANK: Interest certificate FY 2024-25 (SYNTHETIC)", "FD a/c ****981 | Interest credited 42,000 | TDS deducted 4,200", "No other deposit accounts held under this PAN"] },
      itr: { name: "Filed ITR", lines: ["ITR-1 · AY 2025-26 · Filed 28-Jul-2025 (SYNTHETIC)", "Income from salary (net) 9,80,000", "Income from other sources: interest on deposits (Konkan Bank) 42,000", "Gross total income 10,22,000"] },
    },
    items: [{ id: "i1", desc: "Interest on deposits", payer: "Konkan Bank", cat: "interest_deposit", reported: 84000, onReturn: 42000, src: "notice:6" }],
    records: [
      { id: "a3", doc: "ais", line: 3, payer: "Konkan Bank", cat: "interest_deposit", amount: 42000, kind: "third_party" },
      { id: "a5", doc: "ais", line: 5, payer: "Konkan Bank", cat: "interest_deposit", amount: 42000, kind: "third_party" },
      { id: "b2", doc: "bank", line: 2, payer: "Konkan Bank", cat: "interest_deposit", amount: 42000, kind: "bank" },
      { id: "b3", doc: "bank", line: 3, payer: "Konkan Bank", cat: "note", amount: 0, kind: "bank" },
      { id: "r3", doc: "itr", line: 3, payer: "Konkan Bank", cat: "interest_deposit", amount: 42000, kind: "return" },
    ],
    causes: { i1: [{ label: "duplicate_reporting", amountFrom: ["a5"], support: ["a3", "b2", "b3"], confidence: 0.86, rationale: "AIS shows the same ₹42,000 under TDS-194A and again under SFT-005. The bank certificate shows one deposit and a single credit of ₹42,000, which the return already offers." }] },
    draft: "We disagree with the proposed addition of ₹42,000. The ₹84,000 shown in AIS counts the same fixed-deposit interest twice: once as TDS under s.194A {{ais:3}} and once as SFT-005 {{ais:5}}. The bank's certificate shows a single credit of ₹42,000 {{bank:2}} from the only deposit held {{bank:3}}, and this was offered under Income from Other Sources {{itr:3}}. AIS feedback 'Information is duplicate' has been submitted for the SFT entry.",
    expect: { truth: "Disagree: the same interest was counted twice", verdict: "PASS", lesson: "The simplest case. The bank's interest appears twice in AIS. The system spots the duplicate, and every number checks out." },
  },
  {
    id: "IN-02", j: "IN", title: "Rent offered under House Property, AIS shows it as Other Sources",
    notice: { type: "s.143(1)(a) proposed adjustment", year: 2025, yearText: "AY 2025-26", issued: "2026-10-09", statedTotal: 360000, totalSrc: "notice:7" },
    docs: {
      notice: { name: "Notice", lines: [IN_HEAD, "PAN: CD***71P · Assessment Year 2025-26 · Ref CPC/2526/A1/0000102", "Date of issue: 09-Oct-2026 · Response due within 30 days", "Nature of variance: income per AIS/26AS not offered in return", IN_TBL, "1 | Other sources: rent (194-I) | Kestrel Logistics Pvt Ltd (TAN PNEK00002B) | 3,60,000 | 0 | 3,60,000", "Total variance proposed to be added: 3,60,000", "Tax and interest on the addition will be computed on processing."] },
      ais: { name: "AIS FY24-25", lines: ["ANNUAL INFORMATION STATEMENT: FY 2024-25 (SYNTHETIC)", "Part B1 · TDS/TCS information", "TDS-194I(b) | Kestrel Logistics Pvt Ltd | Rent on land/building | Credited 3,60,000 | TDS 36,000", "Part B2 · SFT information: none"] },
      lease: { name: "Licence agmt.", lines: ["LEAVE & LICENCE AGREEMENT (extract, SYNTHETIC)", "Licensor: the taxpayer · Licensee: Kestrel Logistics Pvt Ltd", "Premises: Unit 4, Hadapsar, Pune · Monthly fee 30,000 · Term Apr-2024 to Mar-2027"] },
      itr: { name: "Filed ITR", lines: ["ITR-2 · AY 2025-26 · Filed 25-Jul-2025 (SYNTHETIC)", "Schedule HP · Property 1 (let out) · Tenant: Kestrel Logistics Pvt Ltd", "Gross rent received/receivable 3,60,000", "Less: standard deduction u/s 24(a) @30% 1,08,000", "Income chargeable under House Property 2,52,000", "Schedule OS · Rent: nil", "Schedule TDS2 · Kestrel Logistics Pvt Ltd · TDS 36,000 claimed against HP income"] },
    },
    items: [{ id: "i1", desc: "Rent (194-I) under Other Sources", payer: "Kestrel Logistics Pvt Ltd", cat: "rent_194I", reported: 360000, onReturn: 0, src: "notice:6" }],
    records: [
      { id: "a3", doc: "ais", line: 3, payer: "Kestrel Logistics Pvt Ltd", cat: "rent_194I", amount: 360000, kind: "third_party" },
      { id: "l2", doc: "lease", line: 2, payer: "Kestrel Logistics Pvt Ltd", cat: "note", amount: 0, kind: "other" },
      { id: "h3", doc: "itr", line: 3, payer: "Kestrel Logistics Pvt Ltd", cat: "rent_hp", amount: 360000, kind: "return" },
      { id: "h5", doc: "itr", line: 5, payer: "Kestrel Logistics Pvt Ltd", cat: "hp_net", amount: 252000, kind: "return" },
      { id: "h7", doc: "itr", line: 7, payer: "Kestrel Logistics Pvt Ltd", cat: "rent_hp", amount: 36000, kind: "tds_credit" },
    ],
    causes: { i1: [{ label: "different_head", amountFrom: ["h3"], support: ["l2", "h5"], confidence: 0.88, rationale: "Gross rent of ₹3,60,000 from the same tenant appears in Schedule HP. CPC's matcher compares AIS rent with Schedule OS, so it found nothing there." }] },
    draft: "We disagree with the proposed addition of ₹3,60,000. The rent reported by Kestrel Logistics Pvt Ltd under s.194-I {{ais:3}} was offered as income from house property, not other sources: gross rent of ₹3,60,000 {{itr:3}} and ₹2,52,000 chargeable after the s.24(a) standard deduction {{itr:5}}. The deductor is the licensee named in the agreement {{lease:2}}. The income has not been omitted; it was offered under a different head.",
    expect: { truth: "Disagree: rent was declared under House Property", verdict: "PASS", lesson: "The rent was declared, just in a different section of the return. The system finds it by matching the tenant's name, not the income type." },
  },
  {
    id: "IN-03", j: "IN", title: "Cumulative FD: income deferred but TDS credit claimed",
    notice: { type: "s.143(1)(a) proposed adjustment", year: 2025, yearText: "AY 2025-26", issued: "2026-10-14", statedTotal: 55000, totalSrc: "notice:7" },
    docs: {
      notice: { name: "Notice", lines: [IN_HEAD, "PAN: EF***52M · Assessment Year 2025-26 · Ref CPC/2526/A1/0000103", "Date of issue: 14-Oct-2026 · Response due within 30 days", "Nature of variance: income per AIS/26AS not offered in return", IN_TBL, "1 | Other sources: interest on deposits | Deccan Bank (TAN HYDD00003C) | 55,000 | 0 | 55,000", "Total variance proposed to be added: 55,000", "Tax and interest on the addition will be computed on processing."] },
      ais: { name: "AIS FY24-25", lines: ["ANNUAL INFORMATION STATEMENT: FY 2024-25 (SYNTHETIC)", "Part B1 · TDS/TCS information", "TDS-194A | Deccan Bank | Interest other than on securities | Credited 55,000 | TDS 5,500"] },
      bank: { name: "FD advice", lines: ["DECCAN BANK: Deposit advice (SYNTHETIC)", "Cumulative FD ****212 · opened 01-Jun-2023 · matures 01-Jun-2026 · principal 6,00,000", "Interest accrued FY 2024-25: 55,000 (reinvested, not paid out)", "TDS on accrued interest FY 2024-25: 5,500"] },
      itr: { name: "Filed ITR", lines: ["ITR-2 · AY 2025-26 · Filed 30-Jul-2025 (SYNTHETIC)", "Income from salary (net) 14,20,000", "Schedule OS · Interest offered on receipt basis; FD ****212 interest to be offered on maturity", "Schedule TDS2 · Deccan Bank · TDS 5,500 · credit claimed this year"] },
    },
    items: [{ id: "i1", desc: "Interest on deposits", payer: "Deccan Bank", cat: "interest_deposit", reported: 55000, onReturn: 0, src: "notice:6" }],
    records: [
      { id: "a3", doc: "ais", line: 3, payer: "Deccan Bank", cat: "interest_deposit", amount: 55000, kind: "third_party" },
      { id: "b2", doc: "bank", line: 2, payer: "Deccan Bank", cat: "note", amount: 0, kind: "bank" },
      { id: "b3", doc: "bank", line: 3, payer: "Deccan Bank", cat: "accrued_interest", amount: 55000, kind: "bank" },
      { id: "r3", doc: "itr", line: 3, payer: "Deccan Bank", cat: "note", amount: 0, kind: "other" },
      { id: "t4", doc: "itr", line: 4, payer: "Deccan Bank", cat: "interest_deposit", amount: 5500, kind: "tds_credit" },
    ],
    causes: { i1: [{ label: "timing_difference", amountFrom: ["b3"], support: ["b2", "r3"], confidence: 0.79, rationale: "The bank deducted TDS on accrued interest of a cumulative FD. The taxpayer follows the receipt basis and will offer the interest on maturity in June 2026." }] },
    draft: "We disagree with the proposed addition of ₹55,000. The interest of ₹55,000 {{ais:3}} accrued on a cumulative deposit and was not paid out {{bank:3}}. The taxpayer offers interest on a receipt basis and will offer it in the year of maturity {{itr:3}}.",
    expect: { truth: "A CA must decide (likely agree, or disagree and give up the tax credit)", verdict: "PASS", lesson: "The numbers add up and the AI's story sounds right. But the return claims this year's tax credit while pushing the income to a later year. Both can't be true, so a rule holds back the reply and a CA decides." },
  },
  {
    id: "IN-04", j: "IN", title: "Professional fees under someone else's PAN",
    notice: { type: "s.143(1)(a) proposed adjustment", year: 2025, yearText: "AY 2025-26", issued: "2026-10-16", statedTotal: 120000, totalSrc: "notice:7" },
    docs: {
      notice: { name: "Notice", lines: [IN_HEAD, "PAN: GH***09R · Assessment Year 2025-26 · Ref CPC/2526/A1/0000104", "Date of issue: 16-Oct-2026 · Response due within 30 days", "Nature of variance: income per AIS/26AS not offered in return", IN_TBL, "1 | Other sources: professional fees (194J) | Orion Media Services LLP (TAN DELO00004D) | 1,20,000 | 0 | 1,20,000", "Total variance proposed to be added: 1,20,000", "Tax and interest on the addition will be computed on processing."] },
      ais: { name: "AIS FY24-25", lines: ["ANNUAL INFORMATION STATEMENT: FY 2024-25 (SYNTHETIC)", "Part B1 · TDS/TCS information", "TDS-194J | Orion Media Services LLP | Fees for professional services | Credited 1,20,000 | TDS 12,000", "TDS-192 | Tarang Software Pvt Ltd | Salary | 11,40,000"] },
      f16: { name: "Form 16", lines: ["FORM 16 Part B: FY 2024-25 (SYNTHETIC)", "Employer: Tarang Software Pvt Ltd · full-time employee", "Gross salary 11,40,000"] },
      bankst: { name: "Bank stmt.", lines: ["SAVINGS A/C ****440: credits above 10,000, FY 2024-25 (SYNTHETIC)", "Salary · Tarang Software Pvt Ltd · 12 credits · 9,48,000", "Refund · Income Tax Dept · 1 credit · 14,200", "No credits from Orion Media Services LLP"] },
      itr: { name: "Filed ITR", lines: ["ITR-1 · AY 2025-26 · Filed 19-Jul-2025 (SYNTHETIC)", "Income from salary (gross) 11,40,000", "Income from other sources: savings interest 6,800"] },
    },
    items: [{ id: "i1", desc: "Professional fees (194J)", payer: "Orion Media Services LLP", cat: "fees_194J", reported: 120000, onReturn: 0, src: "notice:6" }],
    records: [
      { id: "a3", doc: "ais", line: 3, payer: "Orion Media Services LLP", cat: "fees_194J", amount: 120000, kind: "third_party" },
      { id: "a4", doc: "ais", line: 4, payer: "Tarang Software Pvt Ltd", cat: "salary", amount: 1140000, kind: "third_party" },
      { id: "f2", doc: "f16", line: 2, payer: "Tarang Software Pvt Ltd", cat: "note", amount: 0, kind: "other" },
      { id: "s4", doc: "bankst", line: 4, payer: "Orion Media Services LLP", cat: "note", amount: 0, kind: "bank" },
      { id: "r2", doc: "itr", line: 2, payer: "Tarang Software Pvt Ltd", cat: "salary", amount: 1140000, kind: "return" },
    ],
    causes: { i1: [{ label: "wrong_pan_attribution", amountFrom: ["a3"], support: ["f2", "s4"], confidence: 0.58, rationale: "There is no engagement with or payment from Orion Media Services LLP anywhere in the taxpayer's documents. The likely cause is the deductor quoting the wrong PAN in its TDS return." }] },
    draft: "We disagree with the proposed addition of ₹1,20,000. The entry of ₹1,20,000 under s.194J from Orion Media Services LLP {{ais:3}} does not relate to this PAN. The taxpayer is a full-time salaried employee {{f16:2}} and received no payment from this entity {{bankst:4}}. Feedback 'Information does not belong to me' has been submitted in AIS, and the deductor has been asked to correct its TDS statement.",
    expect: { truth: "Disagree, if the taxpayer confirms they never worked for this firm", verdict: "PASS (weak)", lesson: "The system can only show that something is missing (no payment from this firm), not prove it. Low AI confidence plus a rule warning send it to a reviewer. Only the payer can correct its record." },
  },
  {
    id: "IN-05", j: "IN", title: "Dividend claimed exempt under a repealed rule",
    notice: { type: "s.143(1)(a) proposed adjustment", year: 2025, yearText: "AY 2025-26", issued: "2026-10-20", statedTotal: 18500, totalSrc: "notice:7" },
    docs: {
      notice: { name: "Notice", lines: [IN_HEAD, "PAN: JK***88S · Assessment Year 2025-26 · Ref CPC/2526/A1/0000105", "Date of issue: 20-Oct-2026 · Response due within 30 days", "Nature of variance: income per AIS/26AS not offered in return", IN_TBL, "1 | Other sources: dividend | Vindhya Paints Ltd (TAN BPLV00005E) | 18,500 | 0 | 18,500", "Total variance proposed to be added: 18,500", "Tax and interest on the addition will be computed on processing."] },
      ais: { name: "AIS FY24-25", lines: ["ANNUAL INFORMATION STATEMENT: FY 2024-25 (SYNTHETIC)", "Part B1 · TDS/TCS information", "TDS-194 | Vindhya Paints Ltd | Dividend | Credited 18,500 | TDS 1,850"] },
      itr: { name: "Filed ITR", lines: ["ITR-2 · AY 2025-26 · Filed 22-Jul-2025 (SYNTHETIC)", "Schedule OS · Dividend: nil", "Schedule EI · Exempt income · Dividend from Indian company 18,500 (claimed u/s 10(34))"] },
    },
    items: [{ id: "i1", desc: "Dividend", payer: "Vindhya Paints Ltd", cat: "dividend_domestic", reported: 18500, onReturn: 0, src: "notice:6" }],
    records: [
      { id: "a3", doc: "ais", line: 3, payer: "Vindhya Paints Ltd", cat: "dividend_domestic", amount: 18500, kind: "third_party" },
      { id: "e3", doc: "itr", line: 3, payer: "Vindhya Paints Ltd", cat: "exempt_claim", amount: 18500, kind: "return" },
    ],
    causes: { i1: [{ label: "exempt_income", amountFrom: ["e3"], support: [], confidence: 0.74, rationale: "The return claims the dividend as exempt u/s 10(34); dividends from Indian companies are exempt in the hands of shareholders." }] },
    draft: "We disagree with the proposed addition of ₹18,500. The dividend from Vindhya Paints Ltd {{ais:3}} is exempt u/s 10(34) and was disclosed in Schedule EI {{itr:3}}.",
    expect: { truth: "Agree: dividends have been taxable since AY 2021-22", verdict: "PASS (guard caught LLM)", lesson: "The AI said the dividend is tax-free under a rule that ended in 2020, the same mistake the taxpayer made. The dated rules table rejects it, so the wrong reply is never written." },
  },
  {
    id: "IN-06", j: "IN", title: "Poor scan: second line unreadable",
    notice: { type: "s.143(1)(a) proposed adjustment", year: 2025, yearText: "AY 2025-26", issued: null, statedTotal: 86700, totalSrc: "notice:8" },
    docs: {
      notice: { name: "Notice (scan)", lines: [IN_HEAD, "PAN: LM***41T · Assessment Year 2025-26 · Ref CPC/2526/A1/00001?6", "Date of issue: 2?-Oct-2026 · Response due within 30 days", "Nature of variance: income per AIS/26AS not offered in return", IN_TBL, "1 | Other sources: interest on deposits | Konkan Bank (TAN MUMK00001A) | 12,300 | 0 | 12,300", "2 | Ot■er sou■ces – ▒▒▒▒ | ▒▒▒▒▒▒ Ltd (TAN ▒▒▒▒) | 7?,4■0 | 0 | 7?,4■0", "Total variance proposed to be added: 86,700"] },
      ais: { name: "AIS FY24-25", lines: ["ANNUAL INFORMATION STATEMENT: FY 2024-25 (SYNTHETIC)", "Part B1 · TDS/TCS information", "TDS-194A | Konkan Bank | Interest other than on securities | Credited 12,300 | TDS 1,230", "TDS-194 | Satpura Cement Ltd | Dividend | Credited 74,400 | TDS 7,440"] },
      itr: { name: "Filed ITR", lines: ["ITR-1 · AY 2025-26 (SYNTHETIC)", "Income from salary (net) 8,10,000", "Income from other sources: nil"] },
    },
    items: [
      { id: "i1", desc: "Interest on deposits", payer: "Konkan Bank", cat: "interest_deposit", reported: 12300, onReturn: 0, src: "notice:6" },
      { id: "i2", desc: "[unreadable]", payer: "?", cat: "unknown", reported: null, onReturn: 0, src: "notice:7" },
    ],
    records: [
      { id: "a3", doc: "ais", line: 3, payer: "Konkan Bank", cat: "interest_deposit", amount: 12300, kind: "third_party" },
      { id: "a4", doc: "ais", line: 4, payer: "Satpura Cement Ltd", cat: "dividend_domestic", amount: 74400, kind: "third_party" },
    ],
    causes: {},
    draft: null,
    reviewerQuestions: ["Download a clean copy of the communication from the e-filing portal (e-Proceedings) and re-key line 2 and the issue date. The AIS dividend from Satpura Cement Ltd (₹74,400) would reconcile the stated total, but the system does not fill the line in by guessing."],
    expect: { truth: "Get a clean copy and re-type it, then probably agree", verdict: "PASS (stopped safely)", lesson: "The scan is unreadable, so the system stops instead of guessing. It notices that one AIS entry would make the totals match, but only offers that as a hint." },
  },

  // ───────────────────────────── UNITED STATES ─────────────────────────────
  {
    id: "US-01", j: "US", title: "1099-B with no cost basis (IRS assumed $0)",
    notice: { type: "CP2000", year: 2024, yearText: "TY 2024", issued: "2026-09-21", respondBy: "2026-10-21", statedTotal: 18400, totalSrc: "notice:7" },
    docs: {
      notice: { name: "CP2000", lines: [US_HEAD, "Tax year 2024 · SSN XXX-XX-4417 · Notice date: September 21, 2026", "Respond by: October 21, 2026", "Income and payment information reported to the IRS that does not match your return", US_TBL, "Lakeshore Brokerage (EIN XX-XXX0193) | 1099-B | Securities proceeds | 18,400 | 0 | 18,400", "Total increase to income: 18,400", "Because cost basis was not reported to us, we used a basis of $0."] },
      b1099: { name: "1099-B", lines: ["FORM 1099-B 2024: Lakeshore Brokerage (SYNTHETIC)", "1a ACME Corp common · 200 sh · 1c date sold 2024-08-12", "1d Proceeds 18,400", "1e Cost basis: not reported · Box 12 basis reported to IRS: No (noncovered security)"] },
      conf: { name: "Trade conf.", lines: ["LAKESHORE BROKERAGE: Trade confirmation (SYNTHETIC)", "Trade date 2015-03-02 · BUY 200 sh ACME Corp @ 79.50", "Total cost incl. commission 15,900"] },
      ret: { name: "Form 1040", lines: ["FORM 1040 · Tax year 2024 · Filed April 10, 2025 (SYNTHETIC)", "1a Wages 74,200", "7 Capital gain or (loss): blank; no Form 8949 / Schedule D attached"] },
    },
    items: [{ id: "i1", desc: "Securities proceeds", payer: "Lakeshore Brokerage", cat: "1099B", reported: 18400, onReturn: 0, src: "notice:6" }],
    records: [
      { id: "b3", doc: "b1099", line: 3, payer: "Lakeshore Brokerage", cat: "1099B", amount: 18400, kind: "third_party" },
      { id: "b4", doc: "b1099", line: 4, payer: "Lakeshore Brokerage", cat: "note", amount: 0, kind: "third_party" },
      { id: "c2", doc: "conf", line: 2, payer: "Lakeshore Brokerage", cat: "note", amount: 0, kind: "other" },
      { id: "c3", doc: "conf", line: 3, payer: "Lakeshore Brokerage", cat: "basis", amount: 15900, kind: "other" },
      { id: "r7", doc: "ret", line: 3, payer: null, cat: "note", amount: 0, kind: "return" },
    ],
    causes: { i1: [
      { label: "basis_not_reported", amountFrom: ["c3"], support: ["b4", "c2"], confidence: 0.9, rationale: "The 1099-B reports gross proceeds for a noncovered lot, and the trade confirmation shows the purchase cost." },
      { label: "genuinely_omitted", remainder: true, support: ["r7"], confidence: 0.84, rationale: "Proceeds minus documented basis is a real gain that never appeared on the return. Held 2015 → 2024, so it is long-term." },
    ] },
    draft: "We agree in part. The $18,400 shown for Lakeshore Brokerage {{b1099:3}} is gross proceeds; basis was not reported to the IRS {{b1099:4}}. The shares were bought on 2015-03-02 {{conf:2}} for $15,900 {{conf:3}}, so the gain is $2,500 and is long-term. We agree that $2,500 of long-term capital gain was omitted {{ret:3}} and disagree with the remaining $15,900. A corrected Form 8949 is attached.",
    expect: { truth: "Partly agree: a $2,500 long-term gain was missed", verdict: "PASS", lesson: "The IRS assumed the shares cost $0. The trade confirmation shows they cost $15,900, so the real gain is $2,500. Code works out the $2,500, not the AI." },
  },
  {
    id: "US-02", j: "US", title: "1099-K from roommate rent splits, plus one unexplained transfer",
    notice: { type: "CP2000", year: 2024, yearText: "TY 2024", issued: "2026-09-28", respondBy: "2026-10-28", statedTotal: 21600, totalSrc: "notice:7" },
    docs: {
      notice: { name: "CP2000", lines: [US_HEAD, "Tax year 2024 · SSN XXX-XX-2290 · Notice date: September 28, 2026", "Respond by: October 28, 2026", "Income and payment information reported to the IRS that does not match your return", US_TBL, "QuickSplit Payments Inc (EIN XX-XXX7781) | 1099-K | Third-party network payments | 21,600 | 0 | 21,600", "Total increase to income: 21,600"] },
      k1099: { name: "1099-K", lines: ["FORM 1099-K 2024: QuickSplit Payments Inc (SYNTHETIC)", "1a Gross amount of payment transactions 21,600"] },
      log: { name: "App export", lines: ["QuickSplit transaction export 2024 (SYNTHETIC)", "J. Ortega → you · 12 transfers · memo 'rent share' · 1,600 each · total 19,200", "K. Lee → you · 2024-03-14 · memo 'camera' · 2,400"] },
      lease: { name: "Lease", lines: ["RESIDENTIAL LEASE (extract, SYNTHETIC)", "Tenant of record: the taxpayer · Monthly rent 3,200", "Occupants: the taxpayer and J. Ortega"] },
      ret: { name: "Form 1040", lines: ["FORM 1040 · Tax year 2024 (SYNTHETIC)", "1a Wages 61,800", "8 Additional income (Schedule 1): none"] },
    },
    items: [{ id: "i1", desc: "Third-party network payments", payer: "QuickSplit Payments Inc", cat: "1099K", reported: 21600, onReturn: 0, src: "notice:6" }],
    records: [
      { id: "k2", doc: "k1099", line: 2, payer: "QuickSplit Payments Inc", cat: "1099K", amount: 21600, kind: "third_party" },
      { id: "g2", doc: "log", line: 2, payer: "QuickSplit Payments Inc", cat: "transfer", amount: 19200, kind: "other" },
      { id: "g3", doc: "log", line: 3, payer: "QuickSplit Payments Inc", cat: "transfer", amount: 2400, kind: "other" },
      { id: "l2", doc: "lease", line: 2, payer: null, cat: "note", amount: 0, kind: "other" },
      { id: "l3", doc: "lease", line: 3, payer: null, cat: "note", amount: 0, kind: "other" },
    ],
    causes: { i1: [{ label: "non_income_reimbursement", amountFrom: ["g2"], support: ["l2", "l3"], confidence: 0.81, rationale: "The 12 'rent share' transfers from a co-occupant named on the lease are cost-sharing, not income. The $2,400 'camera' transfer looks like the sale of a personal item; whether it produced a gain depends on the purchase price, which is not in the documents, so it is left unclassified." }] },
    draft: null,
    reviewerQuestions: ["What did the taxpayer originally pay for the camera sold to K. Lee for $2,400? Selling a personal-use item at a loss is not taxable; a gain is."],
    expect: { truth: "Disagree on $19,200; the $2,400 depends on facts", verdict: "PASS (residue escalated)", lesson: "$19,200 was a roommate paying their share of rent, which isn't income. The last $2,400 can't be explained from the documents, so the system asks one specific question instead of guessing." },
  },
  {
    id: "US-03", j: "US", title: "Interest reported under the bank's pre-merger name",
    notice: { type: "CP2000", year: 2024, yearText: "TY 2024", issued: "2026-10-02", respondBy: "2026-11-02", statedTotal: 1340, totalSrc: "notice:7" },
    docs: {
      notice: { name: "CP2000", lines: [US_HEAD, "Tax year 2024 · SSN XXX-XX-8835 · Notice date: October 2, 2026", "Respond by: November 2, 2026", "Income and payment information reported to the IRS that does not match your return", US_TBL, "Northfield Bank (EIN XX-XXX5520) | 1099-INT | Interest | 1,340 | 0 | 1,340", "Total increase to income: 1,340"] },
      int1099: { name: "1099-INT", lines: ["FORM 1099-INT 2024: Northfield Bank (SYNTHETIC)", "Payer note: Riverton Savings accounts merged into Northfield Bank effective 2024-04-01", "1 Interest income 1,340"] },
      ret: { name: "Form 1040", lines: ["FORM 1040 · Tax year 2024 (SYNTHETIC)", "2b Taxable interest 1,340", "Schedule B Part I · Riverton Savings · 1,340"] },
    },
    items: [{ id: "i1", desc: "Interest", payer: "Northfield Bank", cat: "1099INT", reported: 1340, onReturn: 0, src: "notice:6" }],
    records: [
      { id: "n2", doc: "int1099", line: 2, payer: "Northfield Bank", cat: "note", amount: 0, kind: "third_party" },
      { id: "n3", doc: "int1099", line: 3, payer: "Northfield Bank", cat: "1099INT", amount: 1340, kind: "third_party" },
      { id: "s3", doc: "ret", line: 3, payer: "Riverton Savings", cat: "1099INT", amount: 1340, kind: "return" },
    ],
    causes: { i1: [{ label: "already_reported_elsewhere", amountFrom: ["s3"], support: ["n2"], confidence: 0.83, rationale: "Schedule B lists $1,340 from Riverton Savings, and the 1099-INT itself says Riverton merged into Northfield in April 2024." }] },
    draft: "We disagree. The $1,340 of interest reported by Northfield Bank {{int1099:3}} was included on the return under the bank's former name, Riverton Savings {{ret:3}}. Riverton Savings merged into Northfield Bank on 2024-04-01 {{int1099:2}}. Taxable interest on the return is $1,340 {{ret:2}}.",
    expect: { truth: "Disagree: already reported under the old bank name", verdict: "PASS (reviewer confirm)", lesson: "The bank changed its name after a merger, so the IRS's exact name match failed. The AI sees that the two names are the same bank, and a person confirms it." },
  },
  {
    id: "US-04", j: "US", title: "Forgotten freelance 1099-NEC",
    notice: { type: "CP2000", year: 2024, yearText: "TY 2024", issued: "2026-10-05", respondBy: "2026-11-04", statedTotal: 6000, totalSrc: "notice:7" },
    docs: {
      notice: { name: "CP2000", lines: [US_HEAD, "Tax year 2024 · SSN XXX-XX-6102 · Notice date: October 5, 2026", "Respond by: November 4, 2026", "Income and payment information reported to the IRS that does not match your return", US_TBL, "Brightline Studio LLC (EIN XX-XXX3348) | 1099-NEC | Nonemployee compensation | 6,000 | 0 | 6,000", "Total increase to income: 6,000", "This change also increases your self-employment tax. An accuracy-related penalty (IRC §6662) may apply."] },
      nec: { name: "1099-NEC", lines: ["FORM 1099-NEC 2024: Brightline Studio LLC (SYNTHETIC)", "1 Nonemployee compensation 6,000"] },
      rcpt: { name: "Receipts", lines: ["Receipts folder: freelance design work 2024 (SYNTHETIC)", "Design software subscription (business use) 660", "Drawing tablet (used for client work) 790"] },
      ret: { name: "Form 1040", lines: ["FORM 1040 · Tax year 2024 (SYNTHETIC)", "1a Wages 58,300", "Schedule C: not filed"] },
    },
    items: [{ id: "i1", desc: "Nonemployee compensation", payer: "Brightline Studio LLC", cat: "1099NEC", reported: 6000, onReturn: 0, src: "notice:6" }],
    records: [
      { id: "e2", doc: "nec", line: 2, payer: "Brightline Studio LLC", cat: "1099NEC", amount: 6000, kind: "third_party" },
      { id: "x2", doc: "rcpt", line: 2, payer: null, cat: "expense", amount: 660, kind: "other" },
      { id: "x3", doc: "rcpt", line: 3, payer: null, cat: "expense", amount: 790, kind: "other" },
      { id: "r3", doc: "ret", line: 3, payer: null, cat: "note", amount: 0, kind: "return" },
    ],
    causes: { i1: [{ label: "genuinely_omitted", amountFrom: ["e2"], support: ["r3"], confidence: 0.93, rationale: "The 1099-NEC matches and no Schedule C was filed, so the income was omitted." }] },
    draft: "We agree that $6,000 of nonemployee compensation from Brightline Studio LLC {{nec:2}} was not reported on the return {{ret:3}}.",
    expect: { truth: "Partly agree: report $6,000 but deduct ~$1,450 of expenses", verdict: "FAIL", lesson: "The system only looks at income. Receipts for work expenses were in the folder, but no rule asks about them, so the reply agrees in full and the taxpayer overpays. Fix: a rule that always asks about business expenses." },
  },
  {
    id: "US-05", j: "US", title: "Two funds, same dividend amount: evidence reused",
    notice: { type: "CP2000", year: 2024, yearText: "TY 2024", issued: "2026-10-09", respondBy: "2026-11-09", statedTotal: 2150, totalSrc: "notice:8" },
    docs: {
      notice: { name: "CP2000", lines: [US_HEAD, "Tax year 2024 · SSN XXX-XX-3071 · Notice date: October 9, 2026", "Respond by: November 9, 2026", "Income and payment information reported to the IRS that does not match your return", US_TBL, "Harbor Index Fund (EIN XX-XXX4410) | 1099-DIV | Ordinary dividends | 2,150 | 0 | 2,150", "Cedar Growth Fund (EIN XX-XXX9902) | 1099-DIV | Ordinary dividends | 2,150 | matched to line 3b | 0", "Total increase to income: 2,150"] },
      divA: { name: "1099-DIV A", lines: ["FORM 1099-DIV 2024: Harbor Index Fund (SYNTHETIC)", "1a Total ordinary dividends 2,150"] },
      divB: { name: "1099-DIV B", lines: ["FORM 1099-DIV 2024: Cedar Growth Fund (SYNTHETIC)", "1a Total ordinary dividends 2,150"] },
      ret: { name: "Form 1040", lines: ["FORM 1040 · Tax year 2024 (SYNTHETIC)", "1a Wages 88,000", "3b Ordinary dividends 2,150 (Schedule B not attached)"] },
    },
    items: [{ id: "i1", desc: "Ordinary dividends", payer: "Harbor Index Fund", cat: "1099DIV", reported: 2150, onReturn: 0, src: "notice:6" }],
    matchedByNotice: ["r3b"],
    records: [
      { id: "da", doc: "divA", line: 2, payer: "Harbor Index Fund", cat: "1099DIV", amount: 2150, kind: "third_party" },
      { id: "db", doc: "divB", line: 2, payer: "Cedar Growth Fund", cat: "1099DIV", amount: 2150, kind: "third_party" },
      { id: "r3b", doc: "ret", line: 3, payer: null, cat: "1099DIV", amount: 2150, kind: "return" },
    ],
    causes: { i1: [{ label: "already_reported_elsewhere", amountFrom: ["r3b"], support: ["da"], confidence: 0.77, rationale: "Line 3b shows ordinary dividends of $2,150, which equals the Harbor Index Fund 1099-DIV." }] },
    draft: "We disagree. The $2,150 of ordinary dividends from Harbor Index Fund {{divA:2}} is included in ordinary dividends on line 3b {{ret:3}}.",
    expect: { truth: "Agree: $2,150 was missed (line 3b belongs to the other fund)", verdict: "FAIL (v1) / PASS with ledger guard", lesson: "The design's weakest point. The AI cites a return line with the right amount, but that line already belongs to the other fund. The maths passes; the meaning is wrong. Turn on 'Stop reusing evidence' (top right) to see the fix." },
  },
  {
    id: "US-06", j: "US", title: "State refund 1099-G: depends on last year's return",
    notice: { type: "CP2000", year: 2024, yearText: "TY 2024", issued: "2026-10-12", respondBy: "2026-11-12", statedTotal: 1100, totalSrc: "notice:7" },
    docs: {
      notice: { name: "CP2000", lines: [US_HEAD, "Tax year 2024 · SSN XXX-XX-5528 · Notice date: October 12, 2026", "Respond by: November 12, 2026", "Income and payment information reported to the IRS that does not match your return", US_TBL, "State Dept. of Revenue (EIN XX-XXX0007) | 1099-G | State income tax refund | 1,100 | 0 | 1,100", "Total increase to income: 1,100"] },
      g1099: { name: "1099-G", lines: ["FORM 1099-G 2024: State Dept. of Revenue (SYNTHETIC)", "2 State or local income tax refunds 1,100", "3 Box 3: refund relates to tax year 2023"] },
      ret: { name: "Form 1040", lines: ["FORM 1040 · Tax year 2024 (SYNTHETIC)", "1a Wages 67,500", "12 Standard deduction 14,600", "Schedule 1 line 1 (taxable refunds): blank"] },
    },
    items: [{ id: "i1", desc: "State income tax refund", payer: "State Dept. of Revenue", cat: "1099G", reported: 1100, onReturn: 0, src: "notice:6" }],
    records: [
      { id: "g2", doc: "g1099", line: 2, payer: "State Dept. of Revenue", cat: "1099G", amount: 1100, kind: "third_party" },
      { id: "g3", doc: "g1099", line: 3, payer: "State Dept. of Revenue", cat: "note", amount: 0, kind: "third_party" },
      { id: "r3", doc: "ret", line: 3, payer: null, cat: "std_deduction", amount: 14600, kind: "return" },
    ],
    causes: { i1: [{ label: "state_refund_not_taxable", amountFrom: [], support: ["g3", "r3"], confidence: 0.45, rationale: "The refund is taxable only if the 2023 return itemized and deducted state income tax. The 2024 return's standard deduction says nothing about 2023, and the 2023 return was not provided." }] },
    draft: null,
    reviewerQuestions: ["Obtain the taxpayer's 2023 Form 1040: did they itemize and deduct state income taxes? If they took the standard deduction, the refund is not taxable."],
    expect: { truth: "Unknown without the 2023 return", verdict: "PASS (escalated)", lesson: "Whether the refund is taxable depends on last year's return, which isn't here. The rule requires it, so the system asks for it instead of guessing." },
  },
];
