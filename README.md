# Moodle MCP Server

An MCP (Model Context Protocol) server that enables LLMs to interact with the Moodle platform through three distinct intelligent personas: Admin, Tutor, and Student.

## Architecture Overview

This server implements **three MCP personas** that work together to provide comprehensive learning management:

### 1. **Admin Persona** - Platform Management
Platform administration, system monitoring, user management, and analytics.

**Key Tools**: `admin_monitor_system_health`, `admin_manage_bulk_enrollments`, `admin_get_platform_analytics`

### 2. **Tutor Persona** - Inclusive Training & Cohort Assessment
Quiz management with unlimited attempts, automated grading, cohort-level statistical analysis.

**Key Tools**: `cohort_get_statistics`, `cohort_get_distribution`, `tutor_create_inclusive_quiz`, `tutor_get_intervention_priorities`

**Impact**: Reduces tutor workload by 60-95% through auto-grading and intelligent prioritization.

### 3. **Student Persona** - Personalized Learning
Skill assessment, content adaptation, and personalized learning paths.

**Key Tools**: `student_assess_level`, `student_certify_skill_level`, `student_get_personalized_content`

**Impact**: Content complexity and volume adapted to certified skill level (beginner/intermediate/advanced/expert).

---

## How The Personas Work Together

```
Admin enrolls students → Tutor assesses cohort → Student gets personalized content
                              ↓
                    Cohort statistics analyzed
                    (Gaussian curves, percentiles)
                              ↓
                    Students classified by level
                              ↓
                    Content adapted per student
```

For detailed architecture documentation, see: [`src/personas/README.md`](src/personas/README.md)

---

## Features

### Course Management Tools (Admin)
- `get_courses` - Retrieves the list of all available courses on the Moodle platform
  - Supports filtering by category, search terms, and limit
  - Includes option to get all courses using alternative methods for platforms with large course counts
  - Returns course details: ID, shortname, fullname, category, dates, visibility, and summary
- `get_courses_by_field` - Gets courses filtered by specific field values
  - Supports filtering by: category, shortname, fullname, idnumber, or id
  - Useful for finding specific courses or courses in particular categories
- `get_course_statistics` - Provides comprehensive statistics about courses
  - Basic statistics: total courses, active/inactive counts, categories, average dates
  - Enrollment statistics: total enrolled users, students, teachers, managers
  - Activity statistics: sections, activities, resources, assignments, quizzes, forums
  - Completion statistics: activity completion status (when available)
  - Can be filtered by specific course ID or category ID

### Course Content Tools
- `get_course_contents` - Retrieves the complete content structure of a specific course
  - Includes modules, resources, and activities organized by sections
  - Provides detailed information about each course component
  - Useful for course analysis and content management

### Student Management Tools
- `list_students` - Retrieves the list of students enrolled in the course
  - Displays ID, name, email, and last access time for each student

### Assignment Management Tools
- `get_assignments` - Retrieves all available assignments in the course
  - Includes information such as ID, name, description, due date, and maximum grade
- `get_student_submissions` - Examines a student's submissions for a specific assignment
  - Requires the assignment ID and optionally the student ID
- `provide_assignment_feedback` - Provides grades and comments for a student's submission
  - Requires student ID, assignment ID, grade, and feedback comment

### Quiz Management Tools
- `get_quizzes` - Retrieves all available quizzes in the course
  - Includes information such as ID, name, description, opening/closing dates, and maximum grade
- `get_quiz_attempts` - Examines a student's attempts on a specific quiz
  - Requires the quiz ID and optionally the student ID
- `provide_quiz_feedback` - Provides comments for a quiz attempt
  - Requires the attempt ID and feedback comment

## Requirements

- Node.js (v14 or higher)
- Moodle API token with appropriate permissions
- Moodle course ID (optional for admin tools, required for course-specific operations)

## Installation

1. Clone this repository:
```bash
git clone https://github.com/your-username/moodle-mcp-server.git
cd moodle-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following configuration:
```
MOODLE_API_URL=https://your-moodle.com/webservice/rest/server.php
MOODLE_API_TOKEN=your_api_token
MOODLE_COURSE_ID=1  # Optional: Replace with your course ID for course-specific operations
```

4. Build the server:
```bash
npm run build
```

## Usage with Claude

To use with Claude Desktop, add the server configuration:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`  
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "moodle-mcp-server": {
      "command": "/path/to/node",
      "args": [
        "/path/to/moodle-mcp-server/build/index.js"
      ],
      "env": {
        "MOODLE_API_URL": "https://your-moodle.com/webservice/rest/server.php",
        "MOODLE_API_TOKEN": "your_moodle_api_token",
        "MOODLE_COURSE_ID": "your_course_id"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

For Windows users, the paths would use backslashes:

```json
{
  "mcpServers": {
    "moodle-mcp-server": {
      "command": "C:\\path\\to\\node.exe",
      "args": [
        "C:\\path\\to\\moodle-mcp-server\\build\\index.js"
      ],
      "env": {
        "MOODLE_API_URL": "https://your-moodle.com/webservice/rest/server.php",
        "MOODLE_API_TOKEN": "your_moodle_api_token",
        "MOODLE_COURSE_ID": "your_course_id"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Once configured, Claude will be able to interact with your Moodle platform to:

**Course Management (Admin):**
- View and search all available courses across the platform
- Get comprehensive statistics about courses, enrollments, and activities
- Filter courses by category, name, or other criteria
- Analyze course content structures and activity distributions

**Course Content Analysis:**
- Examine detailed course structures and content organization
- View modules, resources, assignments, and other activities
- Analyze course complexity and resource distribution

**Student & Assignment Management:**
- View the list of students and their submissions
- Provide comments and grades for assignments
- Examine quiz attempts and offer feedback

## Admin vs Course-Specific Operations

The MCP server supports two types of operations:

**Admin Operations** (no course ID required):
- `get_courses` - List all courses on the platform
- `get_courses_by_field` - Search courses by various criteria
- `get_course_statistics` - Get platform-wide or category statistics

**Course-Specific Operations** (requires course ID):
- `get_course_contents` - Analyze specific course structure
- `list_students` - View enrolled students
- `get_assignments` - Manage course assignments
- `get_quizzes` - Handle course quizzes

For admin operations, you only need the Moodle API URL and token. For course-specific operations, set the `MOODLE_COURSE_ID` environment variable.

## Development

For development with auto-rebuild:
```bash
npm run watch
```

### Debugging

MCP servers communicate through stdio, which can make debugging challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.

## Obtaining a Moodle API Token

1. Log in to your Moodle site as an administrator
2. Go to Site Administration > Plugins > Web Services > Manage tokens
3. Create a new token with the necessary permissions to manage courses
4. Copy the generated token and add it to your `.env` file

## Security

- Never share your `.env` file or Moodle API token
- Ensure the MCP server only has access to the courses it needs to manage
- Use a token with the minimum necessary permissions

## License

[MIT](LICENSE)
