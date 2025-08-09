import React, { useMemo, useState } from "react";
import "./styles.css";

/* ---------------- helpers ---------------- */
function yearsFromDOB(dob) {
  if (!dob) return "";
  const d = new Date(dob);
  if (isNaN(d.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return String(age);
}
function formatAllergyList(allergies, nka) {
  if (nka) return "NKA";
  if (!allergies || allergies.length === 0) return "Unknown";
  return allergies.map((a) => `${a.allergen} (${a.reaction})`).join("; ");
}

/* ---------------- reasons + categories ---------------- */
const REASONS = [
  {
    code: "chest_pain",
    label: "Chest pain",
    cat: "Cardiac",
    hint: "ECG within 10 min",
  },
  { code: "short_breath", label: "Shortness of breath", cat: "Respiratory" },
  { code: "palpitations", label: "Palpitations", cat: "Cardiac" },
  { code: "cough", label: "Cough", cat: "Respiratory" },
  { code: "fever", label: "Fever/rigors", cat: "General" },
  { code: "asthma", label: "Asthma flare", cat: "Respiratory" },
  { code: "copd", label: "COPD exacerbation", cat: "Respiratory" },
  { code: "stroke_symptoms", label: "Stroke symptoms (FAST+)", cat: "Neuro" },
  { code: "headache", label: "Headache", cat: "Neuro" },
  { code: "seizure", label: "Seizure", cat: "Neuro" },
  { code: "head_injury", label: "Head injury", cat: "Trauma" },
  { code: "fall", label: "Fall", cat: "Trauma" },
  { code: "fracture_suspected", label: "Suspected fracture", cat: "Trauma" },
  { code: "sprain_strain", label: "Sprain/strain", cat: "Trauma" },
  { code: "limb_pain", label: "Limb/leg pain", cat: "Trauma" },
  { code: "laceration", label: "Laceration", cat: "Trauma" },
  { code: "abdo_pain", label: "Abdominal pain", cat: "Abdo/GI" },
  { code: "vom_diarrhoea", label: "Vomiting/diarrhoea", cat: "Abdo/GI" },
  {
    code: "gi_bleed",
    label: "GI bleed (melaena/haematemesis)",
    cat: "Abdo/GI",
  },
  { code: "uti", label: "UTI symptoms", cat: "GU" },
  { code: "flank_pain", label: "Flank pain", cat: "GU" },
  { code: "preg_bleeding", label: "Pregnancy bleeding", cat: "OB-Gyn" },
  { code: "reduced_fm", label: "Reduced fetal movement", cat: "OB-Gyn" },
  { code: "sore_throat", label: "Sore throat", cat: "ENT/Eye" },
  { code: "ear_pain", label: "Ear pain", cat: "ENT/Eye" },
  { code: "eye_problem", label: "Eye problem", cat: "ENT/Eye" },
  { code: "rash", label: "Rash", cat: "Skin" },
  { code: "cellulitis", label: "Cellulitis/abscess", cat: "Skin" },
  { code: "allergy", label: "Allergic reaction", cat: "Skin" },
  { code: "mental_health", label: "Mental health crisis", cat: "Psych/Tox" },
  { code: "overdose", label: "Overdose/poisoning", cat: "Psych/Tox" },
  { code: "postop_comp", label: "Post-op complication", cat: "Other" },
  { code: "wound_issue", label: "Wound issue", cat: "Other" },
  { code: "dehydration", label: "Dehydration", cat: "Other" },
  { code: "covid", label: "COVID / viral illness", cat: "Other" },
  { code: "other", label: "Other", cat: "Other" },
];

const CATEGORIES = [
  "All",
  "Cardiac",
  "Respiratory",
  "Neuro",
  "Trauma",
  "Abdo/GI",
  "GU",
  "ENT/Eye",
  "Skin",
  "OB-Gyn",
  "Psych/Tox",
  "Other",
];
const COMMON_CODES = new Set([
  "chest_pain",
  "short_breath",
  "abdo_pain",
  "head_injury",
  "fall",
  "fever",
  "stroke_symptoms",
  "laceration",
  "fracture_suspected",
  "uti",
  "vom_diarrhoea",
  "rash",
  "limb_pain",
]);

/* ------------- symptom form typing ------------- */
function formTypeForReason(code, cat) {
  if (code === "chest_pain") return "CHEST_PAIN";
  if (code === "short_breath" || code === "asthma" || code === "copd")
    return "SOB";
  if (code === "stroke_symptoms") return "STROKE";
  if (code === "head_injury") return "HEAD_INJ";
  if (code === "abdo_pain" || code === "vom_diarrhoea" || code === "gi_bleed")
    return "ABDO";
  if (code === "uti" || code === "flank_pain") return "UTI";
  if (
    [
      "limb_pain",
      "fracture_suspected",
      "sprain_strain",
      "fall",
      "laceration",
    ].includes(code)
  )
    return "LIMB";
  if (cat === "Cardiac") return "CHEST_PAIN";
  if (cat === "Respiratory") return "SOB";
  if (cat === "Trauma") return "LIMB";
  if (cat === "Abdo/GI") return "ABDO";
  if (cat === "GU") return "UTI";
  if (cat === "Neuro") return "STROKE";
  return "GEN";
}
function defaultSymptoms(formType) {
  switch (formType) {
    case "CHEST_PAIN":
      return {
        pain_score: "",
        radiation: [],
        exertional: "",
        pleuritic: "",
        diaphoresis: "",
        syncope: "",
        nausea: "",
        duration: "",
        assoc: "",
      };
    case "SOB":
      return {
        sentences: "",
        wheeze: "",
        cough: "",
        fever: "",
        chest_pain: "",
        home_o2: "",
        duration: "",
        assoc: "",
      };
    case "STROKE":
      return {
        fast_face: "",
        fast_arm: "",
        fast_speech: "",
        lkw: "",
        anticoagulated: "",
        seizure_onset: "",
        assoc: "",
      };
    case "HEAD_INJ":
      return {
        loc: "",
        amnesia: "",
        vomits: "0",
        seizure: "",
        anticoagulated: "",
        dangerous_mech: "",
        assoc: "",
      };
    case "ABDO":
      return {
        location: "",
        guarding: "",
        vomiting: "",
        diarrhoea: "",
        urinary: "",
        pregnancy_possible: "",
        assoc: "",
      };
    case "UTI":
      return {
        dysuria: "",
        frequency: "",
        flank_pain: "",
        fever: "",
        confusion: "",
        assoc: "",
      };
    case "LIMB":
      return {
        side: "",
        site: "",
        deformity: "",
        weight_bearing: "",
        nv_compromise: "",
        open_wound: "",
        assoc: "",
      };
    default:
      return { severity: "", duration: "", assoc: "" };
  }
}

/* ---------------- small primitives ---------------- */
function Stepper({ step }) {
  const steps = ["Details", "Complaint", "Symptoms", "Triage & actions"];
  const progress = ((step - 1) / (steps.length - 1)) * 100;
  return (
    <div className="stepper">
      <div className="progress">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="steps">
        {steps.map((label, i) => {
          const n = i + 1;
          const active = step === n;
          const done = step > n;
          return (
            <div key={label} className="step">
              <div
                className={`dot ${active ? "active" : ""} ${
                  done ? "done" : ""
                }`}
              >
                {done ? "✓" : n}
              </div>
              <div className={`label ${active ? "active" : ""}`}>{label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function Seg({ options, value, onChange }) {
  return (
    <div className="seg">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`seg-btn ${value === opt ? "on" : ""}`}
          onClick={() => onChange(value === opt ? "" : opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ---- Allergy input (NKA + structured chips) ---- */
function AllergyInput({ value, onChange, nka, setNka }) {
  const [allergen, setAllergen] = useState("");
  const [reaction, setReaction] = useState("Unknown");
  function add() {
    const a = allergen.trim();
    if (!a) return;
    onChange([...(value || []), { allergen: a, reaction }]);
    setAllergen("");
    setReaction("Unknown");
  }
  function removeAt(i) {
    const next = (value || []).filter((_, idx) => idx !== i);
    onChange(next);
  }
  return (
    <div className="stack">
      <label className="row" style={{ gap: 8 }}>
        <input
          type="checkbox"
          checked={nka}
          onChange={(e) => {
            setNka(e.target.checked);
            if (e.target.checked) onChange([]);
          }}
        />
        <span className="muted">No known allergies (NKA)</span>
      </label>
      <div className="row wrap" style={{ opacity: nka ? 0.5 : 1 }}>
        <input
          className="input"
          placeholder="Allergen (e.g., Penicillin, Nuts)"
          value={allergen}
          onChange={(e) => setAllergen(e.target.value)}
          disabled={nka}
        />
        <select
          className="input select"
          value={reaction}
          onChange={(e) => setReaction(e.target.value)}
          disabled={nka}
        >
          <option>Unknown</option>
          <option>Mild rash</option>
          <option>Swelling</option>
          <option>Breathlessness</option>
          <option>Anaphylaxis</option>
        </select>
        <button
          type="button"
          className="btn btn-neutral"
          onClick={add}
          disabled={nka}
        >
          Add
        </button>
      </div>
      <div className="chips">
        {(!value || value.length === 0) && !nka && (
          <span className="muted">None added</span>
        )}
        {nka && <span className="pill">NKA</span>}
        {(value || []).map((v, i) => (
          <span key={v.allergen + i} className="chip">
            {v.allergen} — {v.reaction}
            <button
              className="chip-x"
              onClick={() => removeAt(i)}
              title="Remove"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---- generic field controls for Symptoms ---- */
function Field({ label, children, desc }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      {desc && <div className="field-desc muted">{desc}</div>}
      <div className="field-ctl">{children}</div>
    </div>
  );
}
function RadioRow({ value, onChange, options }) {
  return (
    <div className="radio-row">
      {options.map((opt) => (
        <label key={opt} className="radio-opt pad">
          <input
            type="radio"
            checked={value === opt}
            onChange={() => onChange(opt)}
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}
function CheckboxRow({ options, values, onChange }) {
  function toggle(opt) {
    const set = new Set(values || []);
    set.has(opt) ? set.delete(opt) : set.add(opt);
    onChange(Array.from(set));
  }
  return (
    <div className="check-row">
      {options.map((opt) => (
        <label key={opt} className="check-opt pad">
          <input
            type="checkbox"
            checked={(values || []).includes(opt)}
            onChange={() => toggle(opt)}
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}

/* ---------------- AI call ---------------- */
async function callOpenAI(prompt) {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  if (!apiKey)
    throw new Error("Missing API key. Set REACT_APP_OPENAI_API_KEY.");
  const body = {
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are an experienced NHS A&E triage assistant. Respond with ONLY valid JSON and keep it concise, safe, and professional.",
      },
      { role: "user", content: prompt },
    ],
  };
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}: ${t}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || "";
  // Extract first JSON object from content (handles code fences)
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Model did not return JSON.");
  return JSON.parse(match[0]);
}

/* Builds the triage prompt */
function buildTriagePrompt({
  patient,
  reason,
  reasonSummary,
  onsetBucket,
  meds,
  allergies,
  nka,
  notes,
  formType,
  symptoms,
}) {
  const safeAllergies = formatAllergyList(allergies, nka);

  return `You are an A&E triage assistant for the NHS. Use cautious UK clinical practice.
Given the intake below, return ONLY a JSON object with these fields:
{
  "triage_category": "Very Urgent" | "Urgent" | "Standard",
  "primary_diagnosis": { "label": string, "probability_percent": number, "rationale": string },
  "secondary_diagnosis": { "label": string, "probability_percent": number, "rationale": string },
  "red_flags": [string],
  "recommended_actions": [ { "label": string, "is_time_critical": boolean } ],
  "summary": string  // <=120 words, plain English sentences describing case & plan.
}

Rules:
- Prioritise life/limb threats. If ambiguous, be conservative.
- No drug dosing. Keep concise, professional, and English only.
- Reflect pregnancy considerations if relevant.

INTAKE
Patient: ${patient.firstName} ${patient.lastName || ""} | Age ${
    patient.age || "?"
  } | Gender ${patient.sex || "?"}
Allergies: ${safeAllergies}
Current meds: ${meds && meds.length ? meds.join(", ") : "Unknown"}
Complaint: ${reason?.label || "Unknown"}${
    onsetBucket ? ` | Onset ${onsetBucket}` : ""
  }
One_line_summary: ${reasonSummary || "—"}
Symptoms_form_type: ${formType}
Symptoms_key: ${JSON.stringify(symptoms)}
Triage_notes: ${notes || "—"}

Return JSON only.`;
}

/* ---------------- main app ---------------- */
export default function App() {
  const [step, setStep] = useState(1);

  /* Step 1 */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState(""); // displayed as “Gender”
  const [allergies, setAllergies] = useState([]); // [{allergen,reaction}]
  const [nka, setNka] = useState(false); // No Known Allergies
  const [meds, setMeds] = useState([]);
  const [notes, setNotes] = useState("");
  const [isPregnant, setIsPregnant] = useState(false);
  const [showValidate, setShowValidate] = useState(false);

  const age = yearsFromDOB(dob);
  const allergiesOk = nka || (allergies && allergies.length > 0);
  const step1Valid = Boolean(
    firstName.trim() && lastName.trim() && dob && sex && allergiesOk
  );

  /* Step 2 (complaint) */
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedReason, setSelectedReason] = useState("");
  const [onsetBucket, setOnsetBucket] = useState("");
  const [reasonSummary, setReasonSummary] = useState("");
  const filteredReasons = useMemo(() => {
    let arr = REASONS;
    if (category !== "All") arr = arr.filter((r) => r.cat === category);
    const q = query.toLowerCase().trim();
    if (q) arr = arr.filter((r) => r.label.toLowerCase().includes(q));
    return arr;
  }, [category, query]);
  const selectedReasonMeta = REASONS.find((r) => r.code === selectedReason);

  /* Step 3 (symptoms) */
  const [symptoms, setSymptoms] = useState({});
  const formType = selectedReasonMeta
    ? formTypeForReason(selectedReasonMeta.code, selectedReasonMeta.cat)
    : "GEN";
  function ensureSymptomDefaults() {
    setSymptoms((prev) =>
      Object.keys(prev).length ? prev : defaultSymptoms(formType)
    );
  }

  /* Step 4 (AI) */
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState("");

  // simple local heuristic fallback if API fails
  function localFallback() {
    const reason = selectedReason;
    let triage = ["chest_pain", "short_breath", "stroke_symptoms"].includes(
      reason
    )
      ? "Very Urgent"
      : reason === "head_injury"
      ? "Urgent"
      : "Standard";

    if (
      formType === "CHEST_PAIN" &&
      (symptoms.syncope === "Yes" || Number(symptoms.pain_score) >= 8)
    )
      triage = "Very Urgent";
    if (formType === "STROKE" && symptoms.lkw) triage = "Very Urgent";
    if (formType === "LIMB" && symptoms.nv_compromise === "Yes")
      triage = "Urgent";

    const primary = {
      label: "Non-specific presentation",
      probability_percent: 40,
      rationale: "Requires further assessment.",
    };
    const secondary = {
      label: "Alternate common cause",
      probability_percent: 20,
      rationale: "Refine with exam and vitals.",
    };

    const onset = onsetBucket ? ` Onset: ${onsetBucket}.` : "";
    const assoc = symptoms.assoc
      ? ` Associated symptoms: ${symptoms.assoc}.`
      : "";
    const summary = `${firstName} ${lastName}, ${age}${
      sex ? ` (${sex})` : ""
    }. Complaint: ${selectedReasonMeta?.label || "Unknown"}.${onset}${
      reasonSummary ? ` Summary: ${reasonSummary}.` : ""
    }${assoc} Proposed urgency: ${triage}.`;

    setAiResult({
      triageCategory: triage,
      redFlags: [],
      diagPrimary: {
        condition: primary.label,
        confidence: primary.probability_percent,
        rationale: primary.rationale,
      },
      diagSecondary: {
        condition: secondary.label,
        confidence: secondary.probability_percent,
        rationale: secondary.rationale,
      },
      nextActions: [],
      explanation: ["Fallback suggestions (API unavailable)."],
      summary,
    });
  }

  async function makeSuggestions() {
    setAiLoading(true);
    setAiError("");
    try {
      const prompt = buildTriagePrompt({
        patient: { firstName, lastName, age, sex },
        reason: selectedReasonMeta,
        reasonSummary,
        onsetBucket,
        meds,
        allergies,
        nka,
        notes,
        formType,
        symptoms,
      });
      const json = await callOpenAI(prompt);

      setAiResult({
        triageCategory: json.triage_category || "Standard",
        redFlags: Array.isArray(json.red_flags) ? json.red_flags : [],
        diagPrimary: json.primary_diagnosis
          ? {
              condition: json.primary_diagnosis.label,
              confidence: json.primary_diagnosis.probability_percent,
              rationale: json.primary_diagnosis.rationale,
            }
          : null,
        diagSecondary: json.secondary_diagnosis
          ? {
              condition: json.secondary_diagnosis.label,
              confidence: json.secondary_diagnosis.probability_percent,
              rationale: json.secondary_diagnosis.rationale,
            }
          : null,
        nextActions: Array.isArray(json.recommended_actions)
          ? json.recommended_actions.map((a) => ({
              id: a.label,
              label: a.label,
              accepted: false,
              hint: a.is_time_critical ? "Time-critical" : "",
            }))
          : [],
        explanation: [
          "Model-generated based on intake; clinician sign-off required.",
        ],
        summary: json.summary || "",
      });
    } catch (err) {
      console.error(err);
      setAiError(err.message || "AI error");
      localFallback();
    } finally {
      setAiLoading(false);
    }
  }

  /* ---------------- render ---------------- */
  return (
    <div className="app">
      <div className="shell">
        <div className="header cardish">
          <div className="brand">
            <div className="logo">🏥</div>
            <div>
              <div className="title">A&E Nurse Onboarding</div>
              <div className="subtitle">
                Fast intake • complaint • symptoms • triage
              </div>
            </div>
          </div>
        </div>

        <Stepper step={step} />

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="card">
            <div className="section-title">Patient details</div>
            <div className="grid grid-2">
              <div className="stack">
                <label className="muted">First name *</label>
                <input
                  className="input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                />
                {showValidate && !firstName.trim() && (
                  <div className="error">Required</div>
                )}
              </div>

              <div className="stack">
                <label className="muted">Last name *</label>
                <input
                  className="input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                />
                {showValidate && !lastName.trim() && (
                  <div className="error">Required</div>
                )}
              </div>

              <div className="stack">
                <label className="muted">Date of birth *</label>
                <div className="row">
                  <input
                    type="date"
                    className="input"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                  <div className="muted age-chip">{age && `Age: ${age}`}</div>
                </div>
                {showValidate && !dob && <div className="error">Required</div>}
              </div>

              <fieldset className="stack fieldset">
                <legend className="muted">Gender *</legend>
                <div className="row sex-row">
                  <label className="row sex-opt pad">
                    <input
                      type="radio"
                      checked={sex === "female"}
                      onChange={() => setSex("female")}
                    />{" "}
                    Female
                  </label>
                  <label className="row sex-opt pad">
                    <input
                      type="radio"
                      checked={sex === "male"}
                      onChange={() => setSex("male")}
                    />{" "}
                    Male
                  </label>
                </div>
                {showValidate && !sex && (
                  <div className="error" id="gender-error">
                    Please select one
                  </div>
                )}
              </fieldset>
            </div>

            <div className="grid grid-2 mt-16">
              <div className="stack">
                <label className="muted">Allergies *</label>
                <AllergyInput
                  value={allergies}
                  onChange={setAllergies}
                  nka={nka}
                  setNka={setNka}
                />
                {showValidate && !allergiesOk && (
                  <div className="error">
                    Select NKA or add at least one allergy
                  </div>
                )}
              </div>

              <div className="stack">
                <label className="muted">Current medications</label>
                <MedsInput values={meds} onChange={setMeds} />
              </div>
            </div>

            {sex === "female" &&
              age &&
              Number(age) >= 12 &&
              Number(age) <= 55 && (
                <div className="banner mt-16">
                  <b>⚠ Pregnancy check</b> — If pregnant or possibly pregnant,
                  triage paths may change.
                  <label className="preg-label">
                    <input
                      type="checkbox"
                      checked={isPregnant}
                      onChange={(e) => setIsPregnant(e.target.checked)}
                    />{" "}
                    Pregnant / possibly
                  </label>
                </div>
              )}

            <div className="stack mt-16">
              <label className="muted">Triage notes (optional)</label>
              <textarea
                className="textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key context, e.g., anticoagulants, safeguarding, language needs…"
              />
            </div>

            <div className="row footer-row">
              <span className="muted">Fields marked * are required.</span>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (step1Valid) setStep(2);
                  else setShowValidate(true);
                }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Complaint */}
        {step === 2 && (
          <ReasonStep
            category={category}
            setCategory={setCategory}
            query={query}
            setQuery={setQuery}
            selectedReason={selectedReason}
            setSelectedReason={setSelectedReason}
            onsetBucket={onsetBucket}
            setOnsetBucket={setOnsetBucket}
            reasonSummary={reasonSummary}
            setReasonSummary={setReasonSummary}
            filteredReasons={filteredReasons}
            selectedReasonMeta={selectedReasonMeta}
            onContinue={() => {
              ensureSymptomDefaults();
              setStep(3);
            }}
            onBack={() => setStep(1)}
          />
        )}

        {/* Step 3: Symptoms */}
        {step === 3 && (
          <SymptomsStep
            selectedReasonMeta={selectedReasonMeta}
            formType={formType}
            symptoms={symptoms}
            setSymptoms={setSymptoms}
            onBack={() => setStep(2)}
            onContinue={() => {
              makeSuggestions();
              setStep(4);
            }}
          />
        )}

        {/* Step 4: Triage summary & actions */}
        {step === 4 && (
          <AIStep
            firstName={firstName}
            lastName={lastName}
            age={age}
            sex={sex}
            isPregnant={isPregnant}
            allergies={allergies}
            nka={nka}
            selectedReasonMeta={selectedReasonMeta}
            onsetBucket={onsetBucket}
            symptoms={symptoms}
            formType={formType}
            aiLoading={aiLoading}
            aiResult={aiResult}
            setAiResult={setAiResult}
            onBack={() => setStep(3)}
            aiError={aiError}
          />
        )}
      </div>
    </div>
  );
}

/* ---------------- smaller components ---------------- */
function MedsInput({ values, onChange }) {
  const [entry, setEntry] = useState("");
  function addEntry() {
    const v = entry.trim();
    if (!v) return;
    if (!(values || []).includes(v)) onChange([...(values || []), v]);
    setEntry("");
  }
  return (
    <div className="stack">
      <div className="row wrap">
        <input
          className="input"
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          placeholder="e.g., Metformin, Warfarin"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addEntry();
            }
          }}
        />
        <button type="button" onClick={addEntry} className="btn btn-neutral">
          Add
        </button>
      </div>
      <div className="chips">
        {(!values || values.length === 0) && (
          <span className="muted">None added</span>
        )}
        {(values || []).map((v, i) => (
          <span key={v + i} className="chip">
            {v}
            <button
              className="chip-x"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              title="Remove"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function ReasonStep(props) {
  const {
    category,
    setCategory,
    query,
    setQuery,
    selectedReason,
    setSelectedReason,
    onsetBucket,
    setOnsetBucket,
    reasonSummary,
    setReasonSummary,
    filteredReasons,
    selectedReasonMeta,
    onContinue,
    onBack,
  } = props;

  return (
    <div className="card">
      <div className="row between mb-8">
        <div className="section-title">Complaint</div>
        <div className="row gap-8">
          <button className="btn btn-ghost" onClick={onBack}>
            ← Back
          </button>
          <button
            className="btn btn-neutral"
            onClick={() => {
              setSelectedReason("");
              setOnsetBucket("");
              setReasonSummary("");
              setCategory("All");
              setQuery("");
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Prominent search above tabs */}
      <div className="searchbar">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M21 21l-4.3-4.3m1.3-5.2a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        <input
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search complaints…"
        />
      </div>

      <div className="tabs mb-12">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`tab ${category === cat ? "active" : ""}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {query.trim() === "" && category === "All" && (
        <div className="muted mb-8">Commonly seen</div>
      )}
      <div className="reasons">
        {(query.trim()
          ? filteredReasons
          : REASONS.filter((r) => COMMON_CODES.has(r.code))
        ).map((r) => {
          const active = selectedReason === r.code;
          return (
            <label
              key={r.code}
              className={`reason no-emoji ${active ? "active" : ""}`}
            >
              <div className="top">
                <div>
                  <div className="reason-title">{r.label}</div>
                  <div className="reason-cat">{r.cat}</div>
                </div>
                <input
                  type="radio"
                  name="reason"
                  checked={active}
                  onChange={() => setSelectedReason(r.code)}
                  aria-label={`Select ${r.label}`}
                />
              </div>
              {r.hint && <div className="hint">{r.hint}</div>}
            </label>
          );
        })}
      </div>

      <div className="grid grid-2 mt-16">
        <div className="stack">
          <label className="muted">Onset</label>
          <Seg
            options={["Now", "<1h", "1–4h", "4–12h", ">12h", "Unknown"]}
            value={onsetBucket}
            onChange={setOnsetBucket}
          />
        </div>
        <div className="stack">
          <label className="muted">One-line summary (optional)</label>
          <input
            className="input"
            maxLength={140}
            value={reasonSummary}
            onChange={(e) => setReasonSummary(e.target.value)}
            placeholder="e.g., Central chest pain for 30 min radiating to left arm."
          />
        </div>
      </div>

      <div className="stickybar">
        <div className="muted">
          {selectedReason
            ? `Selected: ${selectedReasonMeta?.label}${
                onsetBucket ? ` • Onset: ${onsetBucket}` : ""
              }${reasonSummary ? " • Summary added" : ""}`
            : "No complaint selected."}
        </div>
        <div className="row gap-8">
          <button
            className="btn btn-neutral"
            onClick={() => setSelectedReason("")}
          >
            Clear
          </button>
          <button
            className="btn btn-primary"
            disabled={!selectedReason}
            onClick={onContinue}
          >
            Continue to symptoms →
          </button>
        </div>
      </div>
    </div>
  );
}

function SymptomsStep({
  selectedReasonMeta,
  formType,
  symptoms,
  setSymptoms,
  onBack,
  onContinue,
}) {
  const s = symptoms;
  const set = (k, v) => setSymptoms((prev) => ({ ...prev, [k]: v }));

  function Panel() {
    if (formType === "CHEST_PAIN")
      return (
        <div className="form-grid">
          <Field label="Pain score (0–10)">
            <input
              type="number"
              min="0"
              max="10"
              className="input"
              value={s.pain_score ?? ""}
              onChange={(e) => set("pain_score", e.target.value)}
            />
          </Field>
          <Field label="Duration">
            <Seg
              options={["Now", "<1h", "1–4h", "4–12h", ">12h", "Unknown"]}
              value={s.duration ?? ""}
              onChange={(v) => set("duration", v)}
            />
          </Field>
          <Field label="Radiation">
            <CheckboxRow
              options={["Left arm", "Right arm", "Jaw", "Back", "None"]}
              values={s.radiation || []}
              onChange={(v) => set("radiation", v)}
            />
          </Field>
          <Field label="Exertional?">
            <RadioRow
              options={["Yes", "No", "Unknown"]}
              value={s.exertional ?? ""}
              onChange={(v) => set("exertional", v)}
            />
          </Field>
          <Field label="Pleuritic (worse on breath)?">
            <RadioRow
              options={["Yes", "No", "Unknown"]}
              value={s.pleuritic ?? ""}
              onChange={(v) => set("pleuritic", v)}
            />
          </Field>
          <Field label="Diaphoresis (sweats)?">
            <RadioRow
              options={["Yes", "No"]}
              value={s.diaphoresis ?? ""}
              onChange={(v) => set("diaphoresis", v)}
            />
          </Field>
          <Field label="Syncope/near-syncope?">
            <RadioRow
              options={["Yes", "No"]}
              value={s.syncope ?? ""}
              onChange={(v) => set("syncope", v)}
            />
          </Field>
          <Field label="Nausea/vomiting?">
            <RadioRow
              options={["Yes", "No"]}
              value={s.nausea ?? ""}
              onChange={(v) => set("nausea", v)}
            />
          </Field>
          <Field label="Other associated symptoms">
            <input
              className="input"
              value={s.assoc ?? ""}
              onChange={(e) => set("assoc", e.target.value)}
              placeholder="Short free text…"
            />
          </Field>
        </div>
      );
    if (["short_breath", "asthma", "copd"].includes(selectedReasonMeta?.code))
      return (
        <div className="form-grid">
          <Field label="Speaking in full sentences?">
            <RadioRow
              options={["Yes", "No"]}
              value={s.sentences ?? ""}
              onChange={(v) => set("sentences", v)}
            />
          </Field>
          <Field label="Duration">
            <Seg
              options={["Now", "<1h", "1–4h", "4–12h", ">12h", "Unknown"]}
              value={s.duration ?? ""}
              onChange={(v) => set("duration", v)}
            />
          </Field>
          <Field label="Wheeze">
            <RadioRow
              options={["Yes", "No", "Unknown"]}
              value={s.wheeze ?? ""}
              onChange={(v) => set("wheeze", v)}
            />
          </Field>
          <Field label="Cough">
            <RadioRow
              options={["Yes", "No"]}
              value={s.cough ?? ""}
              onChange={(v) => set("cough", v)}
            />
          </Field>
          <Field label="Fever">
            <RadioRow
              options={["Yes", "No"]}
              value={s.fever ?? ""}
              onChange={(v) => set("fever", v)}
            />
          </Field>
          <Field label="Chest pain">
            <RadioRow
              options={["Yes", "No"]}
              value={s.chest_pain ?? ""}
              onChange={(v) => set("chest_pain", v)}
            />
          </Field>
          <Field label="Home oxygen">
            <RadioRow
              options={["Yes", "No"]}
              value={s.home_o2 ?? ""}
              onChange={(v) => set("home_o2", v)}
            />
          </Field>
          <Field label="Other associated symptoms">
            <input
              className="input"
              value={s.assoc ?? ""}
              onChange={(e) => set("assoc", e.target.value)}
              placeholder="Short free text…"
            />
          </Field>
        </div>
      );
    if (selectedReasonMeta?.code === "stroke_symptoms")
      return (
        <div className="form-grid">
          <Field label="FAST – Face droop">
            <RadioRow
              options={["Yes", "No", "Unknown"]}
              value={s.fast_face ?? ""}
              onChange={(v) => set("fast_face", v)}
            />
          </Field>
          <Field label="FAST – Arm weakness">
            <RadioRow
              options={["Yes", "No", "Unknown"]}
              value={s.fast_arm ?? ""}
              onChange={(v) => set("fast_arm", v)}
            />
          </Field>
          <Field label="FAST – Speech changes">
            <RadioRow
              options={["Yes", "No", "Unknown"]}
              value={s.fast_speech ?? ""}
              onChange={(v) => set("fast_speech", v)}
            />
          </Field>
          <Field label="Last known well">
            <input
              type="datetime-local"
              className="input"
              value={s.lkw ?? ""}
              onChange={(e) => set("lkw", e.target.value)}
            />
          </Field>
          <Field label="Anticoagulated">
            <RadioRow
              options={["Yes", "No", "Unknown"]}
              value={s.anticoagulated ?? ""}
              onChange={(v) => set("anticoagulated", v)}
            />
          </Field>
          <Field label="Seizure at onset">
            <RadioRow
              options={["Yes", "No", "Unknown"]}
              value={s.seizure_onset ?? ""}
              onChange={(v) => set("seizure_onset", v)}
            />
          </Field>
          <Field label="Other associated symptoms">
            <input
              className="input"
              value={s.assoc ?? ""}
              onChange={(e) => set("assoc", e.target.value)}
              placeholder="Short free text…"
            />
          </Field>
        </div>
      );
    if (selectedReasonMeta?.code === "head_injury")
      return (
        <div className="form-grid">
          <Field label="Loss of consciousness">
            <RadioRow
              options={["Yes", "No", "Unknown"]}
              value={s.loc ?? ""}
              onChange={(v) => set("loc", v)}
            />
          </Field>
          <Field label="Amnesia">
            <RadioRow
              options={["Yes", "No", "Unknown"]}
              value={s.amnesia ?? ""}
              onChange={(v) => set("amnesia", v)}
            />
          </Field>
          <Field label="Vomiting episodes">
            <Seg
              options={["0", "1", "≥2"]}
              value={s.vomits ?? "0"}
              onChange={(v) => set("vomits", v)}
            />
          </Field>
          <Field label="Seizure">
            <RadioRow
              options={["Yes", "No", "Unknown"]}
              value={s.seizure ?? ""}
              onChange={(v) => set("seizure", v)}
            />
          </Field>
          <Field label="Anticoagulated">
            <RadioRow
              options={["Yes", "No", "Unknown"]}
              value={s.anticoagulated ?? ""}
              onChange={(v) => set("anticoagulated", v)}
            />
          </Field>
          <Field label="Dangerous mechanism">
            <RadioRow
              options={["Yes", "No", "Unknown"]}
              value={s.dangerous_mech ?? ""}
              onChange={(v) => set("dangerous_mech", v)}
            />
          </Field>
          <Field label="Other associated symptoms">
            <input
              className="input"
              value={s.assoc ?? ""}
              onChange={(e) => set("assoc", e.target.value)}
              placeholder="Short free text…"
            />
          </Field>
        </div>
      );
    if (selectedReasonMeta?.cat === "Abdo/GI")
      return (
        <div className="form-grid">
          <Field label="Location">
            <Seg
              options={[
                "RUQ",
                "RLQ",
                "LUQ",
                "LLQ",
                "Epigastric",
                "Suprapubic",
                "Diffuse",
              ]}
              value={s.location ?? ""}
              onChange={(v) => set("location", v)}
            />
          </Field>
          <Field label="Guarding/rigidity">
            <RadioRow
              options={["Yes", "No", "Unknown"]}
              value={s.guarding ?? ""}
              onChange={(v) => set("guarding", v)}
            />
          </Field>
          <Field label="Vomiting">
            <RadioRow
              options={["Yes", "No"]}
              value={s.vomiting ?? ""}
              onChange={(v) => set("vomiting", v)}
            />
          </Field>
          <Field label="Diarrhoea">
            <RadioRow
              options={["Yes", "No"]}
              value={s.diarrhoea ?? ""}
              onChange={(v) => set("diarrhoea", v)}
            />
          </Field>
          <Field label="Urinary symptoms">
            <RadioRow
              options={["Yes", "No"]}
              value={s.urinary ?? ""}
              onChange={(v) => set("urinary", v)}
            />
          </Field>
          <Field label="Pregnancy possible">
            <RadioRow
              options={["Yes", "No", "N/A"]}
              value={s.pregnancy_possible ?? ""}
              onChange={(v) => set("pregnancy_possible", v)}
            />
          </Field>
          <Field label="Other associated symptoms">
            <input
              className="input"
              value={s.assoc ?? ""}
              onChange={(e) => set("assoc", e.target.value)}
              placeholder="Short free text…"
            />
          </Field>
        </div>
      );
    if (selectedReasonMeta?.cat === "GU")
      return (
        <div className="form-grid">
          <Field label="Dysuria (stinging/burning)">
            <RadioRow
              options={["Yes", "No", "Unknown"]}
              value={s.dysuria ?? ""}
              onChange={(v) => set("dysuria", v)}
            />
          </Field>
          <Field label="Frequency/urgency">
            <RadioRow
              options={["Yes", "No", "Unknown"]}
              value={s.frequency ?? ""}
              onChange={(v) => set("frequency", v)}
            />
          </Field>
          <Field label="Flank pain">
            <RadioRow
              options={["Yes", "No", "Unknown"]}
              value={s.flank_pain ?? ""}
              onChange={(v) => set("flank_pain", v)}
            />
          </Field>
          <Field label="Fever">
            <RadioRow
              options={["Yes", "No", "Unknown"]}
              value={s.fever ?? ""}
              onChange={(v) => set("fever", v)}
            />
          </Field>
          <Field label="Confusion (elderly)">
            <RadioRow
              options={["Yes", "No", "N/A"]}
              value={s.confusion ?? ""}
              onChange={(v) => set("confusion", v)}
            />
          </Field>
          <Field label="Other associated symptoms">
            <input
              className="input"
              value={s.assoc ?? ""}
              onChange={(e) => set("assoc", e.target.value)}
              placeholder="Short free text…"
            />
          </Field>
        </div>
      );
    if (selectedReasonMeta?.cat === "Trauma")
      return (
        <div className="form-grid">
          <Field label="Side">
            <Seg
              options={["Left", "Right", "Bilateral", "Unknown"]}
              value={s.side ?? ""}
              onChange={(v) => set("side", v)}
            />
          </Field>
          <Field label="Site">
            <Seg
              options={[
                "Hip",
                "Thigh",
                "Knee",
                "Leg",
                "Ankle",
                "Foot",
                "Shoulder",
                "Arm",
                "Wrist",
                "Hand",
              ]}
              value={s.site ?? ""}
              onChange={(v) => set("site", v)}
            />
          </Field>
          <Field label="Visible deformity">
            <RadioRow
              options={["Yes", "No", "Unknown"]}
              value={s.deformity ?? ""}
              onChange={(v) => set("deformity", v)}
            />
          </Field>
          <Field label="Weight bearing possible">
            <RadioRow
              options={["Yes", "No", "Unknown"]}
              value={s.weight_bearing ?? ""}
              onChange={(v) => set("weight_bearing", v)}
            />
          </Field>
          <Field label="Neurovascular compromise">
            <RadioRow
              options={["Yes", "No", "Unknown"]}
              value={s.nv_compromise ?? ""}
              onChange={(v) => set("nv_compromise", v)}
            />
          </Field>
          <Field label="Open wound">
            <RadioRow
              options={["Yes", "No", "Unknown"]}
              value={s.open_wound ?? ""}
              onChange={(v) => set("open_wound", v)}
            />
          </Field>
          <Field label="Other associated symptoms">
            <input
              className="input"
              value={s.assoc ?? ""}
              onChange={(e) => set("assoc", e.target.value)}
              placeholder="Short free text…"
            />
          </Field>
        </div>
      );
    return (
      <div className="form-grid">
        <Field label="Severity">
          <Seg
            options={["Mild", "Moderate", "Severe"]}
            value={s.severity ?? ""}
            onChange={(v) => set("severity", v)}
          />
        </Field>
        <Field label="Duration">
          <Seg
            options={["Now", "<1h", "1–4h", "4–12h", ">12h", "Unknown"]}
            value={s.duration ?? ""}
            onChange={(v) => set("duration", v)}
          />
        </Field>
        <Field label="Associated symptoms (short)">
          <input
            className="input"
            value={s.assoc ?? ""}
            onChange={(e) => set("assoc", e.target.value)}
            placeholder="e.g., fever, nausea, dizziness"
          />
        </Field>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="row between mb-8">
        <div className="section-title">
          Symptoms — {selectedReasonMeta?.label || "General"}
        </div>
        <div className="row gap-8">
          <button className="btn btn-ghost" onClick={onBack}>
            ← Back
          </button>
          <button
            className="btn btn-neutral"
            onClick={() => setSymptoms(defaultSymptoms(formType))}
          >
            Reset
          </button>
        </div>
      </div>

      {!selectedReasonMeta ? (
        <div className="banner">Please select a complaint first.</div>
      ) : (
        <>
          <Panel />
          <div className="row end gap-8 mt-16">
            <button className="btn btn-ghost" onClick={onBack}>
              Back
            </button>
            <button className="btn btn-primary" onClick={onContinue}>
              Continue →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function AIStep({
  firstName,
  lastName,
  age,
  sex,
  isPregnant,
  allergies,
  nka,
  selectedReasonMeta,
  onsetBucket,
  symptoms,
  formType,
  aiLoading,
  aiResult,
  setAiResult,
  onBack,
  aiError,
}) {
  function allergyDisplay() {
    return formatAllergyList(allergies, nka);
  }
  function urgencyClass(cat) {
    if (cat === "Very Urgent") return "urgency vu";
    if (cat === "Urgent") return "urgency u";
    return "urgency s";
  }

  return (
    <div className="card">
      <div className="row between mb-8">
        <div className="section-title">Triage summary & actions</div>
        <div className="row gap-8">
          <button className="btn btn-ghost" onClick={onBack}>
            ← Back
          </button>
          <button
            className="btn btn-neutral"
            onClick={() => alert("Saved (demo)")}
          >
            Save
          </button>
        </div>
      </div>

      <div className="row chips-wrap">
        <span className="pill">
          {firstName || "—"} {lastName || ""}
        </span>
        {age && <span className="pill">Age {age}</span>}
        {sex && <span className="pill">Gender {sex}</span>}
        {isPregnant && <span className="pill">Pregnant/possible</span>}
        {selectedReasonMeta?.label && (
          <span className="pill">{selectedReasonMeta.label}</span>
        )}
        {onsetBucket && <span className="pill">Onset {onsetBucket}</span>}
        {allergyDisplay() && (
          <span className="pill danger">Allergies: {allergyDisplay()}</span>
        )}
        {formType === "CHEST_PAIN" && symptoms.pain_score !== "" && (
          <span className="pill">Pain {symptoms.pain_score}/10</span>
        )}
        {formType === "STROKE" && symptoms.lkw && (
          <span className="pill">LKW set</span>
        )}
        {formType === "LIMB" && symptoms.nv_compromise === "Yes" && (
          <span className="pill redflag">Red flag: NV compromise</span>
        )}
      </div>

      {aiError && (
        <div className="banner" style={{ marginTop: 12 }}>
          AI: {aiError} • Showing fallback.
        </div>
      )}

      {aiLoading ? (
        <div className="skeleton-wrap">
          <div className="skeleton-row" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      ) : !aiResult ? (
        <div className="banner">
          Complete symptoms and continue to generate suggestions.
        </div>
      ) : (
        <div className="grid">
          <div className="grid grid-2">
            <div className="card p-12">
              <div className="muted">Proposed urgency</div>
              <div className={urgencyClass(aiResult.triageCategory)}>
                {aiResult.triageCategory}
              </div>
            </div>
            <div className="card p-12">
              <div className="muted">Red flags</div>
              {aiResult.redFlags.length === 0 ? (
                <div className="muted">
                  None detected in intake. Continue clinical assessment.
                </div>
              ) : (
                <div className="row chips-wrap">
                  {aiResult.redFlags.map((f, i) => (
                    <span key={f + i} className="pill redflag">
                      Red flag: {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card p-12">
            <div className="section-title">Working diagnosis</div>
            <ul className="list">
              <li className="row-between list-item">
                <div>
                  <div>
                    <strong>Primary:</strong>{" "}
                    {aiResult.diagPrimary?.condition || "—"}
                  </div>
                  {aiResult.diagPrimary?.rationale && (
                    <div className="muted">
                      {aiResult.diagPrimary.rationale}
                    </div>
                  )}
                </div>
                {typeof aiResult.diagPrimary?.confidence === "number" && (
                  <span className="pill">
                    {aiResult.diagPrimary.confidence}%
                  </span>
                )}
              </li>
              <li className="row-between list-item">
                <div>
                  <div>
                    <strong>Secondary:</strong>{" "}
                    {aiResult.diagSecondary?.condition || "—"}
                  </div>
                  {aiResult.diagSecondary?.rationale && (
                    <div className="muted">
                      {aiResult.diagSecondary.rationale}
                    </div>
                  )}
                </div>
                {typeof aiResult.diagSecondary?.confidence === "number" && (
                  <span className="pill">
                    {aiResult.diagSecondary.confidence}%
                  </span>
                )}
              </li>
            </ul>
          </div>

          <div className="card p-12">
            <div className="section-title">
              Recommended next actions (require sign-off)
            </div>
            {aiResult.nextActions.length === 0 ? (
              <div className="muted">No actions suggested.</div>
            ) : (
              <div className="grid">
                {aiResult.nextActions.map((a, idx) => (
                  <label key={a.id + idx} className="row-between list-item">
                    <span>
                      {a.label}
                      {a.hint && <span className="muted"> ({a.hint})</span>}
                    </span>
                    <input
                      type="checkbox"
                      checked={a.accepted}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAiResult((prev) =>
                          prev
                            ? {
                                ...prev,
                                nextActions: prev.nextActions.map((n, i) =>
                                  i === idx ? { ...n, accepted: checked } : n
                                ),
                              }
                            : prev
                        );
                      }}
                    />
                  </label>
                ))}
              </div>
            )}
            <div className="row gap-8 mt-8">
              <button
                className="btn btn-neutral"
                onClick={() =>
                  setAiResult((prev) =>
                    prev
                      ? {
                          ...prev,
                          nextActions: prev.nextActions.map((n) => ({
                            ...n,
                            accepted: true,
                          })),
                        }
                      : prev
                  )
                }
              >
                Accept all
              </button>
              <button
                className="btn btn-primary"
                disabled={
                  aiResult.nextActions.filter((n) => n.accepted).length === 0
                }
                onClick={() =>
                  alert(
                    `Sending ${
                      aiResult.nextActions.filter((n) => n.accepted).length
                    } orders to EPR (demo).`
                  )
                }
              >
                Send selected to EPR
              </button>
            </div>
          </div>

          {/* Summary at the end in plain English */}
          <div className="card p-12">
            <div className="section-title">Summary</div>
            <div className="ai-summary">{aiResult.summary}</div>
          </div>

          <div className="row end gap-8">
            <button className="btn btn-ghost" onClick={onBack}>
              Back
            </button>
            <button
              className="btn btn-primary"
              onClick={() => alert("Case sent to triage with summary (demo).")}
            >
              Finalise & send to triage →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
