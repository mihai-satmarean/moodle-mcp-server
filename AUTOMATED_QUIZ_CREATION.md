# 🤖 Automated Quiz Creation with Browser Automation

## Overview

The Moodle MCP Server now includes **fully automated quiz creation** using Playwright browser automation. AI can now create complete quizzes in Moodle WITHOUT any manual intervention!

## 🎯 What It Does

1. **Generates quiz questions** (in Romanian, formatted for Moodle)
2. **Logs into Moodle** automatically
3. **Creates quiz activity** in the course
4. **Configures settings** (unlimited attempts, review options, etc.)
5. **Imports questions** from generated XML
6. **Publishes quiz**
7. **Returns direct link** to the quiz

## 🚀 Usage

### Basic Example

```javascript
tutor_create_quiz_automated
{
  "username": "your.username@example.com",
  "password": "your-password",
  "courseId": 1301,
  "quizName": "Java Exceptions Quiz",
  "quizIntro": "Test your knowledge of Java exceptions and error handling",
  "themes": [
    {
      "title": "Java Exceptions",
      "description": "Questions about try-catch, throw, throws, and exception hierarchy",
      "keywords": ["exception", "try", "catch", "throw", "finally"]
    }
  ]
}
```

### Natural Language (Recommended)

Just ask Claude/Happy:

```
Creează automat un quiz în cursul 1301 despre Java Exceptions:
- Nume: "Java Exceptions - Practice Quiz"
- 3 întrebări despre try-catch, throw, și exception hierarchy
- Încercări nelimitate
- În română

Username: mihai.satmarean@scoalainformala.ro
Password: [your-password]
```

## 📋 Parameters

### Required

| Parameter | Type | Description |
|-----------|------|-------------|
| `username` | string | Moodle login username |
| `password` | string | Moodle login password |
| `courseId` | number | Course ID where quiz will be created |
| `quizName` | string | Name of the quiz |
| `themes` | array | Array of theme objects for question generation |

### Optional

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `quizIntro` | string | Auto-generated | Quiz introduction text |
| `questionsPerTheme` | number | 1 | Questions per theme |
| `difficulty` | string | 'intermediate' | 'beginner', 'intermediate', or 'advanced' |
| `allowUnlimitedAttempts` | boolean | true | Allow unlimited quiz attempts |
| `headless` | boolean | true | Run browser in headless mode (false to see browser) |

## 🔒 Security

### Environment Variables (Recommended)

Set these in your environment to avoid passing credentials in requests:

```bash
export MOODLE_USERNAME="your.username@example.com"
export MOODLE_PASSWORD="your-secure-password"
```

Then use without credentials parameter:

```javascript
tutor_create_quiz_automated
{
  "courseId": 1301,
  "quizName": "My Quiz",
  "themes": [...]
}
```

### .env File

```bash
# .env
MOODLE_USERNAME=your.username@example.com
MOODLE_PASSWORD=your-secure-password
MOODLE_API_URL=https://moodle.scoalainformala.ro/webservice/rest/server.php
MOODLE_API_TOKEN=your-api-token
```

## 🎬 Example Workflows

### Create Java Collections Quiz

```
Creează automat în cursul 1301:
- Quiz: "Java Collections - ArrayList vs HashMap"  
- 4 întrebări despre ArrayList, HashMap, LinkedList, și când să folosești fiecare
- Nivel: intermediar
- Încercări nelimitate
```

### Create OOP Concepts Quiz

```
Creează quiz automat despre concepte OOP pentru cursul 1301:
- Nume: "OOP Fundamentals"
- 5 întrebări despre:
  * Encapsulation
  * Inheritance  
  * Polymorphism
  * Abstraction
  * Interfaces vs Abstract Classes
- Începători
- Unlimited attempts
```

## 🔍 Debugging

### See Browser in Action

Set `headless: false` to watch the automation:

```javascript
{
  ...
  "headless": false
}
```

### Check Steps

The response includes detailed steps showing what was done:

```
Steps completed:
1. 🎯 Starting automated quiz creation...
2. 📝 Generating quiz questions...
3. ✅ Generated 3 questions
4. 💾 Saved XML to /tmp/moodle-quiz-1234567890.xml
5. 🌐 Launching browser...
6. 🔐 Logging into Moodle...
7. ✅ Logged in successfully
8. 📚 Navigating to course 1301...
9. ✏️ Turning editing on...
10. ➕ Adding quiz activity...
...
```

## 🛠️ Installation Requirements

### Prerequisites

```bash
# Install Playwright
npm install playwright

# Install browser binaries (one-time)
npx playwright install chromium
```

### Docker

The Docker image includes Playwright and Chromium automatically.

## ⚠️ Limitations

1. **Moodle UI Changes**: If Moodle interface changes significantly, selectors may need updates
2. **Network**: Requires stable internet connection
3. **Performance**: Takes ~30-60 seconds per quiz (vs instant XML generation)
4. **Permissions**: User must have teacher/editing rights in the course

## 🆚 Comparison: Automated vs Manual Import

| Feature | Automated (`tutor_create_quiz_automated`) | Manual Import (`tutor_create_quiz_blueprint`) |
|---------|-------------------------------------------|-----------------------------------------------|
| **Time** | ~30-60 seconds | 2-3 minutes (manual clicks) |
| **Intervention** | None - fully automated | Manual import required |
| **Quiz Settings** | Configured automatically | Must configure manually |
| **Credentials** | Requires login | Only API token |
| **Network Reliability** | More sensitive | More robust |
| **Best For** | Batch creation, automation | Single quizzes, custom settings |

## 🎯 Recommendations

### When to Use Automated

- Creating multiple quizzes
- Standardized quiz settings
- Integration with other automation
- Full hands-off workflow

### When to Use Manual Import

- One-off quiz creation
- Custom/complex quiz settings
- Network issues
- Prefer API-only approach

## 🔄 Error Handling

If automation fails, the tool automatically falls back with:

- Detailed error message
- Steps completed before failure
- Suggestion to use manual import as backup

Example error response:

```
❌ Failed to create quiz automatically

Error: Timeout waiting for login button

Steps completed before error:
1. 🎯 Starting automated quiz creation...
2. 📝 Generating quiz questions...
3. ✅ Generated 3 questions
4. 💾 Saved XML to /tmp/moodle-quiz-1234567890.xml
5. 🌐 Launching browser...
6. 🔐 Logging into Moodle...

💡 Tip: You can still use tutor_create_quiz_blueprint to generate XML and import manually.
```

## 📊 Performance Tips

1. **Use headless mode** (default) for faster execution
2. **Batch similar quizzes** - create multiple at once
3. **Cache credentials** via environment variables
4. **Run during off-peak hours** for better performance

## 🎓 Example: Complete Course Setup

Create a complete set of quizzes for Java course:

```javascript
// Week 1: Basics
tutor_create_quiz_automated({ courseId: 1301, quizName: "Java Basics", themes: [...] })

// Week 2: OOP
tutor_create_quiz_automated({ courseId: 1301, quizName: "OOP Concepts", themes: [...] })

// Week 3: Collections
tutor_create_quiz_automated({ courseId: 1301, quizName: "Java Collections", themes: [...] })

// Week 4: Exceptions
tutor_create_quiz_automated({ courseId: 1301, quizName: "Exception Handling", themes: [...] })
```

All quizzes created automatically with no manual intervention!

## 🆘 Support

If you encounter issues:

1. Check credentials are correct
2. Verify you have editing rights in the course
3. Try with `headless: false` to see what's happening
4. Check Moodle site is accessible
5. Fallback to `tutor_create_quiz_blueprint` if automation fails

## 🎉 Success Story

**Before**: Creating 10 quizzes = 30-40 minutes of repetitive clicking

**After**: Creating 10 quizzes = 10 minutes fully automated, while you do other work!
