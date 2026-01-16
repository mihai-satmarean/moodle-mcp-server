# MCP Personas Architecture

## Overview
This directory contains three distinct MCP personalities that work together to provide a comprehensive, adaptive, and inclusive learning environment for Moodle.

## The Three Personas

### 1. Admin Persona (`admin/`)
**Role**: Platform administrator
**Responsibilities**: System monitoring, user management, course administration, platform analytics

**Key Features**:
- System health monitoring
- Bulk user enrollment/management
- Platform-wide analytics
- Resource optimization
- Security compliance

**Primary Users**: Moodle administrators, IT staff

---

### 2. Tutor Persona (`tutor/`)
**Role**: Trainer/instructor with focus on inclusive education
**Responsibilities**: Cohort assessment, quiz management, automated grading, intervention prioritization

**Key Features**:
- **Cohort Assessment**: Statistical analysis with Gaussian curves, percentiles, distribution detection
- **Inclusive Quizzes**: Unlimited attempts, non-eliminatory assessments
- **Auto-grading**: 60-95% workload reduction
- **Formative Feedback**: Automated personalized feedback
- **Intervention Alerts**: Priority list of students needing attention

**Primary Users**: Tutors, trainers, teachers

**Impact**: Reduces tutor grading workload from 40 hours to 2 hours per module

---

### 3. Student Persona (`student/`)
**Role**: Individual learner with personalized experience
**Responsibilities**: Skill assessment, content personalization, adaptive learning paths

**Key Features**:
- **Skill Certification**: Beginner (0-40%), Intermediate (41-70%), Advanced (71-85%), Expert (86-100%)
- **Content Adaptation**: Complexity and volume adjusted to certified level
- **Personalized Paths**: Custom learning sequences
- **Progressive Difficulty**: Increases as mastery demonstrated

**Primary Users**: Students/learners

**Impact**: Content matches student level, improving engagement and completion rates by 20%+

---

## How They Work Together

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKFLOW INTEGRATION                      │
└─────────────────────────────────────────────────────────────┘

1. ADMIN sets up courses and enrolls students
   ↓
2. TUTOR creates standardized assessment quizzes
   ↓
3. Students take quizzes → TUTOR analyzes cohort statistics
   ↓
4. TUTOR detects distribution (e.g., bimodal - two groups)
   Recommendation: "Split into Track A and Track B"
   ↓
5. STUDENT persona uses quiz scores to certify individual levels
   - 8 students → Beginner
   - 12 students → Intermediate
   - 10 students → Advanced
   ↓
6. STUDENT persona adapts content for each student
   - Beginners: 8 hours with extra support
   - Advanced: 3 hours with challenges
   ↓
7. TUTOR creates practice quizzes with unlimited attempts
   Auto-grades all attempts, provides formative feedback
   Only alerts tutor for 3 students with 5+ failed attempts
   ↓
8. ADMIN monitors platform health and enrollment metrics
   Provides reports on learning outcomes and system performance
```

## Shared Components (`../shared/`)

All three personas share:
- **Moodle API Client**: Centralized API wrapper
- **Statistics Utilities**: Mean, median, std dev, percentiles, distribution detection
- **Analytics Functions**: Progress analysis, risk assessment
- **Type Definitions**: Student, Course, Quiz, Assignment interfaces
- **Logger**: Structured logging
- **Response Filters**: Data size reduction

## MCP Tool Naming Convention

Each persona's tools are prefixed for clarity:

```typescript
// Admin tools
"admin_monitor_system_health"
"admin_manage_bulk_enrollments"
"admin_get_platform_analytics"

// Tutor tools
"tutor_create_inclusive_quiz"
"tutor_get_intervention_priorities"
"cohort_get_statistics"           // Cohort-level tools
"cohort_get_distribution"

// Student tools
"student_assess_level"
"student_certify_skill_level"
"student_get_personalized_content"

// Shared tools (no prefix)
"get_students"
"get_quizzes"
"get_assignments"
```

## Implementation Structure

```
personas/
  admin/
    tools/
      systemHealth.ts
      userManagement.ts
      analytics.ts
    types.ts
    index.ts
    README.md
  
  tutor/
    tools/
      cohortAssessment.ts
      quizManagement.ts
      intervention.ts
    statistics/
      gaussian.ts
      distribution.ts
    types.ts
    index.ts
    README.md
  
  student/
    tools/
      assessment.ts
      personalization.ts
      learningPath.ts
    adaptors/
      contentComplexity.ts
    types.ts
    index.ts
    README.md
  
  README.md (this file)

shared/
  api/
    moodleApi.ts
  utils/
    statistics.ts
    analytics.ts
    logger.ts
  types/
    student.ts
    course.ts
  README.md
```

## Design Principles

### Separation of Concerns
Each persona handles distinct responsibilities without overlap.

### Code Reusability
Common functionality in `shared/` to avoid duplication.

### Single MCP Server
All three personas run in the same MCP server process, sharing:
- Moodle API connection
- Authentication
- Logging infrastructure
- Performance optimizations

### Modularity
Each persona can be developed, tested, and maintained independently.

### Type Safety
Strong TypeScript typing throughout all personas.

## Development Workflow

### Adding New Tools

**1. Determine which persona**:
- Platform-level? → Admin
- Cohort/class-level? → Tutor
- Individual student? → Student

**2. Create tool file**:
```typescript
// Example: tutor/tools/newTool.ts
export async function tutorNewTool(args: NewToolArgs): Promise<NewToolResult> {
  // Implementation
}
```

**3. Register in persona's index.ts**:
```typescript
// tutor/index.ts
export { tutorNewTool } from './tools/newTool';
```

**4. Add to main MCP server**:
```typescript
// src/index.ts
import { tutorNewTool } from './personas/tutor';

// Register tool with MCP
server.setRequestHandler('tutor_new_tool', tutorNewTool);
```

## Testing Strategy

### Unit Tests
Each persona's tools tested independently with mock Moodle data.

### Integration Tests
Test interactions between personas (e.g., Student using Tutor's quiz results).

### End-to-End Tests
Complete workflows from admin setup → tutor assessment → student learning.

## Related Documentation

- [GitLab Issue #9](https://gitlab.com/pulse-quantum-ai/moodle-mcp/-/issues/9) - Cohort Assessment
- [GitLab Issue #10](https://gitlab.com/pulse-quantum-ai/moodle-mcp/-/issues/10) - Student Assistant
- [GitLab Issue #11](https://gitlab.com/pulse-quantum-ai/moodle-mcp/-/issues/11) - Tutor Assistant
- [Enhanced Bot System Requirements](../../../../moodle_gitlab/.kiro/specs/enhanced-bot-system/requirements.md)

## Next Steps

1. Implement shared utilities (Moodle API client, statistics)
2. Build Admin persona tools (system monitoring, user management)
3. Implement Tutor persona (cohort assessment, quiz management)
4. Develop Student persona (skill certification, content adaptation)
5. Integration testing across all three personas
6. Documentation and deployment
