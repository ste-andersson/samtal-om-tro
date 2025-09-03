import React from 'react';
import { Case } from '@/types/case';
import { ChecklistResponse } from '@/types/checklist';
import { CaseDefect } from '@/types/checklist';
import { checklistData } from '@/data/checklistData';
import styles from './DocumentView.module.css';

interface DocumentViewProps {
  selectedCase: Case | null;
  checklistResponses: ChecklistResponse[];
  defects: CaseDefect[];
}

const DocumentView: React.FC<DocumentViewProps> = ({
  selectedCase,
  checklistResponses,
  defects,
}) => {
  if (!selectedCase) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        Välj ett ärende för att visa tillsynsmeddelandet
      </div>
    );
  }

  // Create response lookup map
  const responseLookup = checklistResponses.reduce((acc, response) => {
    acc[response.checklist_id] = response;
    return acc;
  }, {} as Record<string, ChecklistResponse>);

  // Get today's date
  const today = new Date().toLocaleDateString('sv-SE');

  return (
    <div className={styles.documentContainer}>
      <div className={styles.documentPage}>
        {/* Header */}
        <div className={styles.documentHeader}>
          <h1 className={styles.agencyName}>RÄDDNINGSTJÄNSTEN STORGÖTEBORG</h1>
          <h2 className={styles.documentTitle}>MEDDELANDE OM TILLSYN ENLIGT LSO</h2>
          <h3 className={styles.documentSubtitle}>Brandskyddskontroll</h3>
        </div>

        {/* Case Information */}
        <div className={styles.caseInfoSection}>
          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Ärendenummer:</span>
              <span className={styles.infoValue}>{selectedCase.case_number}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Datum:</span>
              <span className={styles.infoValue}>{today}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Verksamhet:</span>
              <span className={styles.infoValue}>{selectedCase.name}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Adress:</span>
              <span className={styles.infoValue}>{selectedCase.address}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Kontrollant:</span>
              <span className={styles.infoValue}>RSG</span>
            </div>
          </div>
        </div>

        {/* Introduction */}
        <div className={styles.introduction}>
          <p>
            Räddningstjänsten Storgöteborg har genomfört tillsyn enligt lagen om skydd mot olyckor (LSO) 
            vid ovan angiven verksamhet. Nedan redovisas resultatet av kontrollen.
          </p>
        </div>

        {/* Defects Sections */}
        {defects.length > 0 && (
          <div className={styles.defectsMainSection}>
            {/* Brister Section */}
            <div className={styles.defectsSection}>
              <h3 className={styles.sectionTitle}>FÖLJANDE BRISTER HAR UPPMÄRKSAMMATS AV RSG</h3>
              <div className={styles.defectsList}>
                {defects
                  .sort((a, b) => a.defect_number - b.defect_number)
                  .map((defect) => (
                    <div key={`brist-${defect.id}`} className={styles.defectItem}>
                      <span className={styles.defectNumber}>{defect.defect_number}.</span>
                      <span className={styles.defectDescription}>
                        {defect.brist || defect.description}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Åtgärder Section */}
            <div className={styles.defectsSection}>
              <h3 className={styles.sectionTitle}>ÅTGÄRDER SOM RSG ÖVERVÄGER ATT BESLUTA OM</h3>
              <div className={styles.defectsList}>
                {defects
                  .sort((a, b) => a.defect_number - b.defect_number)
                  .filter(defect => defect.atgard)
                  .map((defect) => (
                    <div key={`atgard-${defect.id}`} className={styles.defectItem}>
                      <span className={styles.defectNumber}>{defect.defect_number}.</span>
                      <span className={styles.defectDescription}>{defect.atgard}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Motivering Section */}
            <div className={styles.defectsSection}>
              <h3 className={styles.sectionTitle}>MOTIVERING AV ÅTGÄRDER</h3>
              <div className={styles.defectsList}>
                {defects
                  .sort((a, b) => a.defect_number - b.defect_number)
                  .filter(defect => defect.motivering)
                  .map((defect) => (
                    <div key={`motivering-${defect.id}`} className={styles.defectItem}>
                      <span className={styles.defectNumber}>{defect.defect_number}.</span>
                      <span className={styles.defectDescription}>{defect.motivering}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Checklist Sections */}
        <div className={styles.checklistSections}>
          <h3 className={styles.sectionTitle}>KONTROLLPUNKTER</h3>
          
          {/* Group checklist items by section */}
          {Object.entries(
            checklistData.reduce((acc, item) => {
              if (!acc[item.section]) {
                acc[item.section] = [];
              }
              acc[item.section].push(item);
              return acc;
            }, {} as Record<string, typeof checklistData>)
          ).map(([sectionName, items]) => (
            <div key={sectionName} className={styles.checklistSection}>
              <h4 className={styles.sectionHeading}>{sectionName}</h4>
              
              {items.map((item) => {
                const response = responseLookup[item.id];
                return (
                  <div key={item.id} className={styles.checklistItem}>
                    <div className={styles.questionRow}>
                      <span className={styles.questionId}>{item.id}</span>
                      <span className={styles.questionText}>{item.question}</span>
                      <span className={styles.answerBox}>
                        {response?.answer || '___'}
                      </span>
                    </div>
                    {response?.comment && (
                      <div className={styles.commentRow}>
                        <span className={styles.commentLabel}>Kommentar:</span>
                        <span className={styles.commentText}>{response.comment}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={styles.documentFooter}>
          <div className={styles.signatureSection}>
            <div className={styles.datePlace}>
              <span>Göteborg {today}</span>
            </div>
            <div className={styles.signatureLine}>
              <div className={styles.signatureSpace}></div>
              <div className={styles.signatureLabel}>
                Räddningstjänsten Storgöteborg<br />
                Brandingenjör
              </div>
            </div>
          </div>
          
          <div className={styles.contactInfo}>
            <p><strong>Räddningstjänsten Storgöteborg</strong></p>
            <p>Olof Asklunds gata 13</p>
            <p>421 30 Västra Frölunda</p>
            <p>Telefon: 031-61 61 61</p>
            <p>E-post: info@rsg.se</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentView;