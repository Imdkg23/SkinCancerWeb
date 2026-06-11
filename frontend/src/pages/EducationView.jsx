import React from 'react';

export default function EducationView() {
  return (
    <div className="education-container">
      <div className="medical-header">
        <h2>Dermatological Reference & Assessment Guidelines</h2>
        <p>Clinical resource guide for evaluating cutaneous lesions and identifying key warning markers of melanocytic malignancy.</p>
      </div>

      <div className="abcde-showcase">
        <h3>The ABCDE Clinical Tracking Framework</h3>
        <div className="abcde-grid">
          <div className="abcde-card">
            <div className="abcde-letter">A</div>
            <h4>Asymmetry</h4>
            <p>One half of the cutaneous lesion layout does not mirror or match the structural orientation of the opposite half.</p>
          </div>
          <div className="abcde-card">
            <div className="abcde-letter">B</div>
            <h4>Border</h4>
            <p>The margins are irregular, poorly defined, ragged, notched, or gradually blur out into surrounding healthy tissue layers.</p>
          </div>
          <div className="abcde-card">
            <div className="abcde-letter">C</div>
            <h4>Color</h4>
            <p>Pigmentation varies unevenly across the lesion area, displaying chaotic shades of brown, black, red, pink, blue, or white.</p>
          </div>
          <div className="abcde-card">
            <div className="abcde-letter">D</div>
            <h4>Diameter</h4>
            <p>Melanomas typically exceed 6mm in size (roughly the width of a pencil eraser), though they can present smaller.</p>
          </div>
          <div className="abcde-card">
            <div className="abcde-letter">E</div>
            <h4>Evolving</h4>
            <p>The skin lesion changes shape, absolute size, colors, elevation profile, or initiates secondary responses like localized bleeding or itching.</p>
          </div>
        </div>
      </div>
    </div>
  );
}