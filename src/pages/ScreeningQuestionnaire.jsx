import React, { useMemo, useState } from "react";
import { auth, db } from "../firebase";
import { doc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useSearchParams } from "react-router-dom";

// ---------- QUESTION SETS & SCORING ----------

// GAD-7 (Anxiety)
const GAD7_QUESTIONS = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it is hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid as if something awful might happen",
];

const GAD7_OPTIONS = [
  { label: "Not at all", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 },
];

function interpretGAD7(score) {
  if (score <= 4) return "Minimal anxiety";
  if (score <= 9) return "Mild anxiety";
  if (score <= 14) return "Moderate anxiety";
  return "Severe anxiety";
}

// PCL-5 (shortened example – you can expand to full 20 if you want)
const PCL5_QUESTIONS = [
  "Repeated, disturbing, and unwanted memories of the stressful experience",
  "Avoiding memories, thoughts, or feelings related to the stressful experience",
  "Feeling distant or cut off from other people",
  "Feeling very upset when something reminded you of the stressful experience",
  "Trouble experiencing positive feelings (for example, being unable to feel happiness or loving feelings)",
];

const PCL5_OPTIONS = [
  { label: "Not at all", value: 0 },
  { label: "A little bit", value: 1 },
  { label: "Moderately", value: 2 },
  { label: "Quite a bit", value: 3 },
  { label: "Extremely", value: 4 },
];

function interpretPCL5(score) {
  // For full PCL-5, common cutpoints are around 31–33.
  if (score < 10) return "Low PTSD symptom level (screen negative)";
  if (score < 20) return "Moderate PTSD symptom level (monitor)";
  return "High PTSD symptom level (consider professional assessment)";
}

// MDQ (simplified format)
const MDQ_QUESTIONS = [
  "Has there ever been a period when you felt so good or hyper that other people thought you were not your normal self or you were so hyper that you got into trouble?",
  "Have you ever been so irritable that you shouted at people or started fights or arguments?",
  "Have you ever felt much more self‑confident than usual?",
  "Have you ever needed much less sleep than usual and still felt rested?",
  "Have you ever been much more talkative or spoke much faster than usual?",
];

const MDQ_OPTIONS = [
  { label: "No", value: 0 },
  { label: "Yes", value: 1 },
];

function interpretMDQ(score) {
  if (score <= 2) return "Low likelihood of bipolar spectrum (screen negative)";
  if (score <= 4) return "Some symptoms suggestive (monitor, consider discussion)";
  return "High symptom endorsement (consider professional assessment)";
}

// AUDIT (short version with 10 items – here showing 5 for brevity, you can extend)
const AUDIT_QUESTIONS = [
  "How often do you have a drink containing alcohol?",
  "How many standard drinks containing alcohol do you have on a typical day when you are drinking?",
  "How often do you have six or more drinks on one occasion?",
  "How often during the last year have you found that you were not able to stop drinking once you had started?",
  "How often during the last year have you failed to do what was normally expected of you because of drinking?",
];

const AUDIT_OPTIONS_Q1 = [
  { label: "Never", value: 0 },
  { label: "Monthly or less", value: 1 },
  { label: "2–4 times a month", value: 2 },
  { label: "2–3 times a week", value: 3 },
  { label: "4 or more times a week", value: 4 },
];

const AUDIT_OPTIONS_Q2 = [
  { label: "1 or 2", value: 0 },
  { label: "3 or 4", value: 1 },
  { label: "5 or 6", value: 2 },
  { label: "7 to 9", value: 3 },
  { label: "10 or more", value: 4 },
];

const AUDIT_OPTIONS_FREQ = [
  { label: "Never", value: 0 },
  { label: "Less than monthly", value: 1 },
  { label: "Monthly", value: 2 },
  { label: "Weekly", value: 3 },
  { label: "Daily or almost daily", value: 4 },
];

function interpretAUDIT(score) {
  if (score < 8) return "Low risk (sensible drinking)";
  if (score < 16) return "Hazardous drinking";
  if (score < 20) return "Harmful drinking";
  return "Possible alcohol dependence";
}

// ---------- CONFIG MAP ----------

const QUESTIONNAIRE_CONFIG = {
  GAD7: {
    id: "GAD7",
    title: "GAD-7 Anxiety Self-Assessment",
    description:
      "The GAD-7 helps screen for and measure the severity of generalized anxiety symptoms. This is a self-assessment, not a diagnosis.",
    questions: GAD7_QUESTIONS,
    getOptionsForIndex: () => GAD7_OPTIONS,
    interpretScore: interpretGAD7,
  },
  PCL5: {
    id: "PCL5",
    title: "PCL-5 PTSD Symptom Checklist (Short)",
    description:
      "This shortened PCL-5 screens for post-traumatic stress symptoms related to a stressful experience. It is for awareness only, not a diagnosis.",
    questions: PCL5_QUESTIONS,
    getOptionsForIndex: () => PCL5_OPTIONS,
    interpretScore: interpretPCL5,
  },
  MDQ: {
    id: "MDQ",
    title: "Mood Disorder Questionnaire (MDQ) – Short Form",
    description:
      "The MDQ is a brief screening tool for bipolar spectrum symptoms. It does not replace a professional evaluation.",
    questions: MDQ_QUESTIONS,
    getOptionsForIndex: () => MDQ_OPTIONS,
    interpretScore: interpretMDQ,
  },
  AUDIT: {
    id: "AUDIT",
    title: "AUDIT – Alcohol Use Disorders Identification Test (Short)",
    description:
      "The AUDIT screens for risky or harmful alcohol use. Please answer honestly; this is private and for your self-awareness.",
    questions: AUDIT_QUESTIONS,
    getOptionsForIndex: (index) => {
      if (index === 0) return AUDIT_OPTIONS_Q1;
      if (index === 1) return AUDIT_OPTIONS_Q2;
      return AUDIT_OPTIONS_FREQ;
    },
    interpretScore: interpretAUDIT,
  },
};

function ScreeningQuestionnaire() {
  const user = auth.currentUser;
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get("type") || "GAD7"; // default

  const config = useMemo(
    () => QUESTIONNAIRE_CONFIG[typeParam] || QUESTIONNAIRE_CONFIG.GAD7,
    [typeParam]
  );

  const [answers, setAnswers] = useState(Array(config.questions.length).fill(null));
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  if (!user) {
    return <p>Please log in to complete this assessment.</p>;
  }

  const handleChange = (qIndex, value) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[qIndex] = value;
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (answers.some((a) => a === null)) {
      setError("Please answer all questions before submitting.");
      return;
    }

    try {
      setError("");
      setSubmitting(true);

      const totalScore = answers.reduce((sum, v) => sum + v, 0);
      const severityLabel = config.interpretScore(totalScore);

      const payload = {
        userId: user.uid,
        type: config.id,
        totalScore,
        severityLabel,
        answers,
        createdAt: serverTimestamp(),
      };

      const userDocRef = doc(db, "users", user.uid);
      const colRef = collection(userDocRef, "screeningResults");
      await addDoc(colRef, payload);

      setResult({ totalScore, severityLabel });
    } catch (e) {
      console.error(e);
      setError("Failed to save result. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "1rem" }}>
      <h2>{config.title}</h2>
      <p>{config.description}</p>
      <p style={{ fontSize: 13, color: "#555" }}>
        This tool is for self-assessment and awareness only. It does not provide a diagnosis or replace professional care.
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <ol style={{ marginTop: "1rem" }}>
        {config.questions.map((q, qi) => {
          const options = config.getOptionsForIndex(qi);
          return (
            <li key={qi} style={{ marginBottom: "1rem" }}>
              <p style={{ marginBottom: "0.3rem" }}>{q}</p>
              <div>
                {options.map((opt) => (
                  <label key={opt.label} style={{ marginRight: "1rem", fontSize: 14 }}>
                    <input
                      type="radio"
                      name={`q-${qi}`}
                      value={opt.value}
                      checked={answers[qi] === opt.value}
                      onChange={() => handleChange(qi, opt.value)}
                    />
                    {" "}{opt.label}
                  </label>
                ))}
              </div>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        style={{ padding: "0.5rem 1rem", marginTop: "0.5rem" }}
      >
        {submitting ? "Submitting..." : "Submit & Save Result"}
      </button>

      {result && (
        <div style={{ marginTop: "1rem", padding: "0.75rem", border: "1px solid #ddd" }}>
          <p>
            <strong>Total score:</strong> {result.totalScore}
          </p>
          <p>
            <strong>Interpretation:</strong> {result.severityLabel}
          </p>
          <p style={{ fontSize: 13, color: "#555" }}>
            If your score is high or you feel concerned, consider speaking with a mental health professional or trusted support
            person. This result is for your awareness only.
          </p>
        </div>
      )}
    </div>
  );
}

export default ScreeningQuestionnaire;
