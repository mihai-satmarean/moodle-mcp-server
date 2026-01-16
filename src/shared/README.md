# Shared Components

## Purpose
Common code, utilities, and types used across all three MCP personas (Admin, Tutor, Student).

## Components

### API Client
```typescript
// moodleApi.ts
class MoodleApiClient {
  // Centralized Moodle API wrapper
  // Handles authentication, rate limiting, error handling
}
```

### Types & Interfaces
```typescript
// types.ts
interface Student { ... }
interface Course { ... }
interface Quiz { ... }
interface Assignment { ... }
interface Submission { ... }
```

### Utilities

#### Statistics
```typescript
// statistics.ts
calculateMean(values: number[]): number
calculateMedian(values: number[]): number
calculateStdDev(values: number[]): number
calculatePercentile(values: number[], percentile: number): number
detectDistributionMode(values: number[]): 'normal' | 'bimodal' | 'multimodal'
```

#### Analytics
```typescript
// analytics.ts
analyzeStudentProgress(student: Student, data: ProgressData): Analytics
calculateCompletionRate(assignments: Assignment[], submissions: Submission[]): number
identifyAtRiskStudents(students: Student[], threshold: number): Student[]
```

#### Logger
```typescript
// logger.ts
class Logger {
  info(message: string, context?: object): void
  warn(message: string, context?: object): void
  error(message: string, error: Error, context?: object): void
  debug(message: string, data?: any): void
}
```

#### Validators
```typescript
// validators.ts
validateStudentId(id: number): boolean
validateCourseId(id: number): boolean
validateQuizAttempt(attempt: QuizAttempt): ValidationResult
```

### Response Filters
```typescript
// responseFilter.ts
class ResponseFilter {
  // Data filtering to reduce payload size
  filterStudentData(data: any, mode: 'summary' | 'detailed'): any
  filterCourseData(data: any, mode: 'summary' | 'detailed'): any
  excludeFields(obj: any, excludePaths: string[]): any
}
```

### Error Handling
```typescript
// errors.ts
class MoodleApiError extends Error { ... }
class ValidationError extends Error { ... }
class AuthenticationError extends Error { ... }
```

## Usage Example

```typescript
// In admin/tools/systemHealth.ts
import { MoodleApiClient, Logger } from '../../shared';
import { calculateMean } from '../../shared/statistics';

export async function monitorSystemHealth() {
  const client = new MoodleApiClient();
  const logger = new Logger();
  
  // Use shared components
  const data = await client.getCourses();
  const avgEnrollment = calculateMean(data.map(c => c.enrollmentCount));
  
  logger.info('System health checked', { avgEnrollment });
}
```

## Implementation Files
```
shared/
  api/
    moodleApi.ts
    authentication.ts
  types/
    student.ts
    course.ts
    quiz.ts
    assignment.ts
  utils/
    statistics.ts
    analytics.ts
    logger.ts
    validators.ts
    responseFilter.ts
  errors/
    errors.ts
  index.ts  # Export all shared components
```

## Design Principles
- **DRY**: Don't repeat code across personas
- **Single responsibility**: Each utility has one clear purpose
- **Type safety**: Strong TypeScript typing throughout
- **Testability**: All utilities are pure functions where possible
- **Performance**: Efficient algorithms for statistics and analytics
