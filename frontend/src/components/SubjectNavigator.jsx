import React from 'react';

const SubjectNavigator = ({ sections, currentSectionIndex, onSectionChange, sectionProgress }) => {
    return (
        <div className="subject-tabs">
            {sections.map((section, index) => {
                const progress = sectionProgress[section.subject_id] || { answered: 0, total: 0 };
                const isActive = index === currentSectionIndex;

                return (
                    <button
                        key={section.subject_id}
                        onClick={() => onSectionChange(index)}
                        className={`subject-tab ${isActive ? 'active' : ''}`}
                        style={{
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}
                    >
                        <span style={{ fontWeight: '600' }}>{section.subject_name}</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                            {progress.answered}/{progress.total}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default SubjectNavigator;
