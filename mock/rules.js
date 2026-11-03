// Versioned rules table. This is where tax knowledge lives: in code, reviewed by a human,
// effective-dated. The LLM may only propose labels from this closed taxonomy; it never
// decides rates, deadlines, exemptions or what response is allowed.
// SYNTHETIC / NOT PRACTITIONER-REVIEWED. For demonstration only.
window.RULES = {
  version: "2026-11-03-draft",
  reviewedBy: "unreviewed (prototype)",

  IN: {
    name: "India",
    currency: "₹",
    locale: "en-IN",
    yearLabel: "AY",
    // Assessment years (by starting calendar year) this table has been checked for.
    supportedYears: [2024, 2025],
    deadline: { type: "days_from_issue", days: 30, ref: "s.143(1)(a), first proviso: response within 30 days of the communication" },
    reviewerRoles: ["Chartered Accountant", "Authorised representative (s.288)", "Taxpayer (self)"],
    labels: {
      duplicate_reporting: {
        id: "IN-R01", name: "Same income reported twice in AIS", response: "Disagree",
        action: "Submit AIS feedback 'Information is duplicate'; disagree in e-Proceedings.",
        judgement: false,
      },
      different_head: {
        id: "IN-R02", name: "Income offered under a different head", response: "Disagree",
        action: "Disagree; point to the schedule where the income was offered.",
        judgement: false,
      },
      timing_difference: {
        id: "IN-R03", name: "Timing difference (accrual vs receipt)", response: "Disagree",
        action: "Disagree; reviewer must confirm the method of accounting is followed consistently.",
        judgement: true,
        conflictKind: "tds_credit",
        conflictMsg: "The return claims TDS credit from this payer while deferring the income. TDS credit follows the year in which the income is assessed (s.199 read with Rule 37BA), so 'timing difference' and 'credit claimed this year' cannot both stand. Reviewer must choose: agree to the addition, or disagree and withdraw the credit.",
      },
      wrong_pan_attribution: {
        id: "IN-R04", name: "Information does not belong to this PAN", response: "Disagree",
        action: "AIS feedback 'Information does not belong to me'; ask the deductor to revise its TDS statement. Taxpayer cannot fix this alone.",
        judgement: true,
        requiresSupportKinds: ["bank", "other"],
        warn: "Absence of a credit in one bank account is weak evidence. Confirm the taxpayer has no other accounts and no relationship with the payer.",
      },
      exempt_income: {
        id: "IN-R05", name: "Income is exempt", response: "Disagree",
        action: "Disagree; cite the exemption section.",
        judgement: false,
        // Effective-dated: exemption valid only for AYs in [fromYear, toYear] (null = open).
        exemptCategories: [
          { category: "ppf_interest", ref: "s.10(11)", fromYear: null, toYear: null },
          { category: "dividend_domestic", ref: "s.10(34): ended when Dividend Distribution Tax was abolished (Finance Act 2020); dividends taxable from AY 2021-22", fromYear: null, toYear: 2020 },
        ],
      },
      genuinely_omitted: {
        id: "IN-R06", name: "Income genuinely omitted", response: "Agree",
        action: "Accept the adjustment; reviewer checks the tax and interest computed by CPC.",
        judgement: false,
        remainderAllowed: true,
      },
    },
  },

  US: {
    name: "United States (federal)",
    currency: "$",
    locale: "en-US",
    yearLabel: "TY",
    supportedYears: [2023, 2024, 2025],
    deadline: { type: "printed", ref: "Response date printed on the CP2000 (generally 30 days; 60 if the taxpayer is outside the US)" },
    reviewerRoles: ["CPA", "Enrolled Agent", "Attorney", "Taxpayer (self)"],
    labels: {
      basis_not_reported: {
        id: "US-R01", name: "Gross proceeds reported, cost basis missing", response: "Disagree",
        action: "Disagree for the basis amount; attach corrected Form 8949 with basis documentation.",
        judgement: false,
      },
      non_income_reimbursement: {
        id: "US-R02", name: "Payments are reimbursements, not income", response: "Disagree",
        action: "Disagree; attach transaction history and agreement showing cost-sharing.",
        judgement: false,
      },
      already_reported_elsewhere: {
        id: "US-R03", name: "Already reported on the return (different line or payer name)", response: "Disagree",
        action: "Disagree; point to the return line where the income appears.",
        judgement: true,
        warn: "Confirm the return line really is this payer's income and not another payer's.",
      },
      state_refund_not_taxable: {
        id: "US-R05", name: "State refund not taxable (no prior-year itemized deduction)", response: "Disagree",
        action: "Disagree; attach prior-year return showing the standard deduction.",
        judgement: false,
        requiresKind: "prior_year_return",
      },
      genuinely_omitted: {
        id: "US-R04", name: "Income genuinely omitted", response: "Agree",
        action: "Agree; reviewer checks the IRS tax, penalty and interest computation.",
        judgement: false,
        remainderAllowed: true,
      },
    },
  },
};
