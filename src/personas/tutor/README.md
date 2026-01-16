# Tutor MCP Persona

## Responsibilities
Inclusive training methodology, quiz creation with unlimited attempts, automated grading, and cohort-level assessment.

## MCP Tools

### Cohort Assessment & Statistical Analysis
- `cohort_get_statistics` - Calculate mean, median, std deviation, percentiles for cohort scores
- `cohort_get_distribution` - Gaussian curve data for visualization
- `cohort_detect_distribution_modes` - Identify bimodal/multimodal patterns (sub-groups)
- `cohort_classify_students` - Automatic categorization into beginner/intermediate/advanced/expert
- `cohort_identify_outliers` - Flag students significantly above/below average
- `cohort_get_visualization_data` - Data formatted for charts (histograms, box plots, radar)
- `cohort_get_competency_heatmap` - Student × Skill matrix for detailed analysis
- `cohort_recommend_strategy` - Suggest teaching approach based on distribution
- `cohort_compare_benchmarks` - Historical or cross-cohort comparisons

### Quiz Creation & Management ✅ IMPLEMENTED
- `tutor_create_quiz_blueprint` - Generate quiz with AI questions from themes (returns Moodle XML)
- `tutor_create_adaptive_quiz` - Create personalized remediation quiz based on student weak areas
- `tutor_list_quizzes_with_stats` - List quizzes with creation capability information
- `tutor_extract_themes_from_content` - Extract themes from documents for quiz generation
- `tutor_get_quiz_creation_guide` - Comprehensive guide for quiz creation workflow

### Analytics & Insights
- `tutor_analyze_cohort_quiz_performance` - Statistical analysis of quiz results across all students
- `tutor_identify_common_misconceptions` - Detect patterns in wrong answers across cohort

### Intervention & Prioritization
- `tutor_get_intervention_priorities` - Ranked list of students needing tutor attention
- `tutor_track_improvement_trends` - Monitor student growth over multiple attempts

### Automation & Feedback
- `tutor_automate_formative_feedback` - Generate personalized feedback based on attempt patterns
- `tutor_reduce_grading_workload` - Intelligent automation of routine grading tasks

### Shared Tools
- `get_students` - List enrolled students
- `get_quizzes` - List quizzes in course
- `get_assignments` - List assignments
- `get_submissions` - Get student submissions

## Key Features
- **Unlimited attempts philosophy** - Non-eliminatory assessments
- **Formative assessment** - Focus on learning process, not just final result
- **Workload reduction** - 60-95% reduction in manual grading time
- **Statistical cohort analysis** - Rapid evaluation with visualizations

## Data Sources
- Quiz attempts and scores (all attempts, not just best)
- Student submissions across cohort
- Assignment grades and completion rates
- Improvement trajectories over multiple attempts

## Implementation Files
```
tutor/
  tools/
    cohortAssessment.ts      ✅ Implemented
    quizManagement.ts        ✅ Implemented
    quizCreation.ts          ✅ Implemented (5 MCP tools)
    analytics.ts             🚧 Planned
    intervention.ts          🚧 Planned
    automation.ts            🚧 Planned
  persona-config.ts          ✅ Implemented
  index.ts                   ✅ Implemented
```

## Quiz Creation Workflow

### Method 1: Blueprint from Themes
```typescript
// Step 1: Extract themes from content
tutor_extract_themes_from_content({
  content: "Your training material...",
  maxThemes: 3
})

// Step 2: Create quiz blueprint
tutor_create_quiz_blueprint({
  name: "Module 1 Assessment",
  courseId: 123,
  themes: [...], // from step 1
  questionsPerTheme: 5,
  difficulty: "intermediate",
  allowUnlimitedAttempts: true
})

// Step 3: Import Moodle XML to course
```

### Method 2: Adaptive Quiz for Remediation
```typescript
// Analyzes student performance and creates targeted quiz
tutor_create_adaptive_quiz({
  studentId: 456,
  sourceQuizId: 789,
  newQuizName: "Remediation Quiz - Student 456",
  targetAccuracy: 70
})
```

### Method 3: List & Analyze Existing Quizzes
```typescript
tutor_list_quizzes_with_stats({
  courseId: 123
})
```

## Important Notes

### Moodle API Limitations
- Moodle Web Services **do not support direct quiz creation**
- Quiz blueprints are generated as **Moodle XML** for manual import
- This is a Moodle platform limitation, not an MCP limitation

### Workaround Strategy
1. Generate quiz structure programmatically
2. Export as Moodle XML format
3. Import via Moodle UI (takes 30 seconds)
4. All quizzes follow **inclusive training principles**:
   - Unlimited attempts by default
   - Immediate feedback
   - Show correct answers
   - Highest grade counts

### Future Enhancement
Once Moodle provides quiz creation API, these tools can be updated to create quizzes directly without manual import.
