'use client';

export default function StrengthBar({ strength }) {
  return (
    <div className="strength-wrap">
      <div className="strength-head">
        <span>Password strength</span>
        <span className={`strength-badge ${strength.tone}`}>{strength.label}</span>
      </div>
      <div className="strength-track" aria-hidden="true">
        <div
          className={`strength-fill ${strength.tone}`}
          style={{ width: `${strength.score}%` }}
        />
      </div>
      <p className="strength-score">Score: {strength.score}/100</p>
    </div>
  );
}
