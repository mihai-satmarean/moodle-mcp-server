# Student MCP Persona

## Responsibilities
Personalized learning experience, skill level certification, adaptive content delivery, and individualized learning paths.

## MCP Tools

### Assessment & Certification
- `student_assess_level` - Initial competency diagnostic across key topics
  - Input: courseId, studentId, competencyAreas[]
  - Output: skillScores, overallLevel, strengths, weaknesses

- `student_certify_skill_level` - Formal certification of student's current competency
  - Input: studentId, assessmentResults
  - Output: certifiedLevel (beginner/intermediate/advanced/expert), validUntil, certificate

### Content Personalization
- `student_get_personalized_content` - Content filtered and adapted to student's certified level
  - Input: studentId, moduleId, certifiedLevel
  - Output: filteredContent, adaptedComplexity, estimatedTime

- `student_adjust_content_complexity` - Dynamic adjustment of material difficulty
  - Input: studentId, contentId, performanceData
  - Output: adjustedContent, newDifficultyLevel, rationale

### Learning Path Management
- `student_get_adaptive_learning_path` - Personalized sequence of learning materials
  - Input: studentId, courseId, certifiedLevel, learningGoals
  - Output: sequencedModules, checkpoints, estimatedCompletion

- `student_track_mastery_progress` - Monitor progression towards next level certification
  - Input: studentId, currentLevel
  - Output: progressPercentage, masteryIndicators, nextCertificationReady

### Shared Tools
- `get_assignments` - List assignments (filtered by level)
- `get_submissions` - Get student's own submissions
- `get_submission_content` - Detailed submission content
- `get_quiz_grade` - Student's quiz performance

## Skill Levels & Content Adaptation

| Level | Score Range | Content Adaptation |
|-------|-------------|-------------------|
| **Beginner** | 0-40% | More examples, step-by-step guidance, simplified explanations, frequent checkpoints, extra practice |
| **Intermediate** | 41-70% | Standard curriculum, balanced theory/practice, moderate complexity, regular assessments |
| **Advanced** | 71-85% | Enrichment materials, complex scenarios, independent challenges, leadership roles |
| **Expert** | 86-100% | Mastery-level content, research opportunities, teaching others, innovation projects |

## Key Features
- **Skill certification** - Formal assessment and classification
- **Adaptive complexity** - Content matches student's competency
- **Personalized pacing** - Each student moves at optimal speed
- **Progressive difficulty** - Increases as mastery is demonstrated

## Data Sources
- Individual student assessments
- Quiz scores and attempt patterns
- Assignment submissions and grades
- Learning velocity and engagement metrics
- Content interaction data (time spent, completion rates)

## Implementation Files
```
student/
  tools/
    assessment.ts
    certification.ts
    personalization.ts
    learningPath.ts
  adaptors/
    contentComplexity.ts
    difficultyAdjustment.ts
  types.ts
  index.ts
```
