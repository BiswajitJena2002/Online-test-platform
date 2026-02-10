import React from 'react';

const SubjectSectionManager = ({ sections, setSections, isDualLanguage }) => {
    const addSection = () => {
        setSections([...sections, {
            subject_id: `subject${sections.length + 1}`,
            subject_name: '',
            questions: [],
            questionsOdia: []
        }]);
    };

    const removeSection = (index) => {
        setSections(sections.filter((_, i) => i !== index));
    };

    const updateSectionName = (index, name) => {
        const newSections = [...sections];
        newSections[index].subject_name = name;
        newSections[index].subject_id = name.toLowerCase().replace(/\s+/g, '_');
        setSections(newSections);
    };

    const updateSectionQuestions = (index, value, isOdia = false) => {
        const newSections = [...sections];
        const field = isOdia ? 'questionsOdia' : 'questions';
        try {
            newSections[index][field] = JSON.parse(value);
        } catch {
            newSections[index][field] = value;
        }
        setSections(newSections);
    };

    return (
        <div style={{ background: '#fef9e7', padding: '1.5rem', borderRadius: '8px', border: '2px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, color: '#92400e' }}>Subject Sections</h4>
                <button
                    onClick={addSection}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                >
                    ➕ Add Section
                </button>
            </div>

            {sections.map((section, sectionIndex) => (
                <div key={sectionIndex} style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #d1d5db' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h5 style={{ margin: 0, color: '#1f2937' }}>Section {sectionIndex + 1}</h5>
                        {sections.length > 1 && (
                            <button
                                onClick={() => removeSection(sectionIndex)}
                                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                                🗑️ Remove
                            </button>
                        )}
                    </div>

                    {/* Subject Name */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Subject Name *</label>
                        <input
                            type="text"
                            value={section.subject_name}
                            onChange={(e) => updateSectionName(sectionIndex, e.target.value)}
                            placeholder="e.g., Mathematics, Science, English"
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                        />
                    </div>

                    {/* Questions */}
                    <div style={{ display: 'flex', gap: '1rem', flexDirection: isDualLanguage ? 'row' : 'column' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                Questions (JSON) {isDualLanguage && '(English)'}
                            </label>
                            <textarea
                                style={{
                                    width: '100%',
                                    height: '200px',
                                    padding: '0.75rem',
                                    fontFamily: 'monospace',
                                    fontSize: '0.85rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    resize: 'vertical'
                                }}
                                value={typeof section.questions === 'string' ? section.questions : JSON.stringify(section.questions, null, 2)}
                                onChange={(e) => updateSectionQuestions(sectionIndex, e.target.value, false)}
                                placeholder='[{"question_id": 1, "question": "...", "options": {...}, "correct_answer": "a"}]'
                            />
                        </div>

                        {isDualLanguage && (
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Questions (Odia)
                                </label>
                                <textarea
                                    style={{
                                        width: '100%',
                                        height: '200px',
                                        padding: '0.75rem',
                                        fontFamily: 'monospace',
                                        fontSize: '0.85rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        resize: 'vertical'
                                    }}
                                    value={typeof section.questionsOdia === 'string' ? section.questionsOdia : JSON.stringify(section.questionsOdia, null, 2)}
                                    onChange={(e) => updateSectionQuestions(sectionIndex, e.target.value, true)}
                                    placeholder='[{"question_id": 1, "question": "...", "options": {...}, "correct_answer": "a"}]'
                                />
                            </div>
                        )}
                    </div>
                </div>
            ))}

            <div style={{ marginTop: '1rem', padding: '1rem', background: '#fef3c7', borderRadius: '4px', fontSize: '0.9rem', color: '#92400e' }}>
                💡 <strong>Tip:</strong> Each section should have its own set of questions. Question IDs should be unique across all sections.
            </div>
        </div>
    );
};

export default SubjectSectionManager;
