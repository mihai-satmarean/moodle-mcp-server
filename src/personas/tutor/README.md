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

### Quiz Creation & Management
- `tutor_create_inclusive_quiz` - Generate quiz with unlimited attempts and scaffolded difficulty
- `tutor_generate_quiz_variations` - Create multiple versions covering same competencies
- `tutor_create_standardized_assessment` - Generate cohort evaluation quizzes

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
    cohortAssessment.ts
    quizManagement.ts
    analytics.ts
    intervention.ts
    automation.ts
  statistics/
    gaussian.ts
    percentiles.ts
    distribution.ts
  types.ts
  index.ts
```
