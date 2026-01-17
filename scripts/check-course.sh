#!/bin/bash

# Direct API check for Moodle course participants
# Usage: ./check-course.sh COURSE_ID

COURSE_ID=${1:-1301}
ENV_FILE=".env"

# Load environment variables
if [ -f "$ENV_FILE" ]; then
    export $(cat $ENV_FILE | grep -v '^#' | xargs)
else
    echo "ERROR: .env file not found"
    exit 1
fi

if [ -z "$MOODLE_API_URL" ] || [ -z "$MOODLE_API_TOKEN" ]; then
    echo "ERROR: MOODLE_API_URL or MOODLE_API_TOKEN not set in .env"
    exit 1
fi

echo "=== CHECKING COURSE $COURSE_ID ==="
echo ""
echo "API URL: $MOODLE_API_URL"
echo ""

# Method 1: Get enrolled users
echo "METHOD 1: core_enrol_get_enrolled_users"
echo "-------------------------------------------"

RESPONSE=$(curl -s -G "$MOODLE_API_URL" \
    --data-urlencode "wstoken=$MOODLE_API_TOKEN" \
    --data-urlencode "wsfunction=core_enrol_get_enrolled_users" \
    --data-urlencode "courseid=$COURSE_ID" \
    --data-urlencode "moodlewsrestformat=json")

# Check for errors
if echo "$RESPONSE" | grep -q '"exception"'; then
    echo "ERROR from Moodle API:"
    echo "$RESPONSE" | jq '.'
    exit 1
fi

# Count total users
TOTAL_USERS=$(echo "$RESPONSE" | jq '. | length')
echo "Total users returned: $TOTAL_USERS"

if [ "$TOTAL_USERS" -gt 0 ]; then
    echo ""
    echo "Users breakdown by role:"
    echo "$RESPONSE" | jq -r '.[] | .roles[]? | .shortname' | sort | uniq -c
    
    echo ""
    echo "All users with roles:"
    echo "$RESPONSE" | jq -r '.[] | "ID: \(.id), Name: \(.fullname), Roles: \((.roles // [] | map(.shortname) | join(", ")))"'
    
    echo ""
    echo "Students only (role=student):"
    STUDENTS=$(echo "$RESPONSE" | jq '[.[] | select(.roles[]?.shortname == "student")]')
    STUDENT_COUNT=$(echo "$STUDENTS" | jq 'length')
    echo "Total students: $STUDENT_COUNT"
    
    if [ "$STUDENT_COUNT" -gt 0 ]; then
        echo "$STUDENTS" | jq -r '.[] | "  - \(.fullname) (ID: \(.id), Email: \(.email))"'
    fi
fi

echo ""
echo "METHOD 2: core_course_get_courses_by_field"
echo "-------------------------------------------"

COURSE_RESPONSE=$(curl -s -G "$MOODLE_API_URL" \
    --data-urlencode "wstoken=$MOODLE_API_TOKEN" \
    --data-urlencode "wsfunction=core_course_get_courses_by_field" \
    --data-urlencode "field=id" \
    --data-urlencode "value=$COURSE_ID" \
    --data-urlencode "moodlewsrestformat=json")

echo "$COURSE_RESPONSE" | jq -r '.courses[]? | "Course ID: \(.id)\nCourse Name: \(.fullname)\nShort Name: \(.shortname)\nVisible: \(.visible)"'

echo ""
echo "=== END CHECK ==="
