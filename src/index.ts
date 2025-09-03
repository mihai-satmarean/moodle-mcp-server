#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

// Environment variable configuration
const MOODLE_API_URL = process.env.MOODLE_API_URL;
const MOODLE_API_TOKEN = process.env.MOODLE_API_TOKEN;
const MOODLE_COURSE_ID = process.env.MOODLE_COURSE_ID;

// Verify that the environment variables are defined
if (!MOODLE_API_URL) {
  throw new Error('MOODLE_API_URL environment variable is required');
}

if (!MOODLE_API_TOKEN) {
  throw new Error('MOODLE_API_TOKEN environment variable is required');
}

if (!MOODLE_COURSE_ID) {
  throw new Error('MOODLE_COURSE_ID environment variable is required');
}

// Interfaces for data types
interface Student {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
}

interface Assignment {
  id: number;
  name: string;
  duedate: number;
  allowsubmissionsfromdate: number;
  grade: number;
  timemodified: number;
  cutoffdate: number;
}

interface Quiz {
  id: number;
  name: string;
  timeopen: number;
  timeclose: number;
  grade: number;
  timemodified: number;
}

interface Submission {
  id: number;
  userid: number;
  status: string;
  timemodified: number;
  gradingstatus: string;
  gradefordisplay?: string;
}

interface SubmissionContent {
  assignment: number;
  userid: number;
  status: string;
  submissiontext?: string;
  plugins?: Array<{
    type: string;
    content?: string;
    files?: Array<{
      filename: string;
      fileurl: string;
      filesize: number;
      filetype: string;
    }>;
  }>;
  timemodified: number;
}

interface QuizGradeResponse {
  hasgrade: boolean;
  grade?: string; // This field is only present if hasgrade is true
}

class MoodleMcpServer {
  private server: Server;
  private axiosInstance;

  constructor() {
    this.server = new Server(
      {
        name: 'moodle-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.axiosInstance = axios.create({
      baseURL: MOODLE_API_URL,
      params: {
        wstoken: MOODLE_API_TOKEN,
        moodlewsrestformat: 'json',
      },
    });

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_students',
          description: 'Gets the list of students enrolled in the configured course',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'get_assignments',
          description: 'Gets the list of assignments in the configured course',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'get_quizzes',
          description: 'Gets the list of quizzes in the configured course',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'get_submissions',
          description: 'Gets the assignment submissions in the configured course',
          inputSchema: {
            type: 'object',
            properties: {
              studentId: {
                type: 'number',
                description: 'Optional student ID. If not provided, submissions from all students will be returned',
              },
              assignmentId: {
                type: 'number',
                description: 'Optional assignment ID. If not provided, all submissions will be returned',
              },
            },
            required: [],
          },
        },
        {
          name: 'provide_feedback',
          description: 'Provides feedback on an assignment submitted by a student',
          inputSchema: {
            type: 'object',
            properties: {
              studentId: {
                type: 'number',
                description: 'Student ID',
              },
              assignmentId: {
                type: 'number',
                description: 'Assignment ID',
              },
              grade: {
                type: 'number',
                description: 'Numeric grade to assign',
              },
              feedback: {
                type: 'string',
                description: 'Text of the feedback to provide',
              },
            },
            required: ['studentId', 'assignmentId', 'feedback'],
          },
        },
        {
          name: 'get_submission_content',
          description: 'Gets the detailed content of a specific submission, including text and attachments',
          inputSchema: {
            type: 'object',
            properties: {
              studentId: {
                type: 'number',
                description: 'Student ID',
              },
              assignmentId: {
                type: 'number',
                description: 'Assignment ID',
              },
            },
            required: ['studentId', 'assignmentId'],
          },
        },
        {
          name: 'get_quiz_grade',
          description: 'Gets the grade of a student in a specific quiz',
          inputSchema: {
            type: 'object',
            properties: {
              studentId: {
                type: 'number',
                description: 'Student ID',
              },
              quizId: {
                type: 'number',
                description: 'Quiz ID',
              },
            },
            required: ['studentId', 'quizId'],
          },
        },
        {
          name: 'get_courses',
          description: 'Gets the list of all available courses on the Moodle platform (Admin tool)',
          inputSchema: {
            type: 'object',
            properties: {
              categoryId: {
                type: 'number',
                description: 'Optional category ID to filter courses by category',
              },
              searchTerm: {
                type: 'string',
                description: 'Optional search term to filter courses by name',
              },
              limit: {
                type: 'number',
                description: 'Optional limit for number of courses to return (default: 100)',
              },
            },
            required: [],
          },
        },
        {
          name: 'get_course_contents',
          description: 'Gets the complete content structure of a specific course including modules, resources, and activities',
          inputSchema: {
            type: 'object',
            properties: {
              courseId: {
                type: 'number',
                description: 'Course ID to get contents for (defaults to configured course if not provided)',
              },
              includeModules: {
                type: 'boolean',
                description: 'Whether to include detailed module information (default: true)',
              },
              includeResources: {
                type: 'boolean',
                description: 'Whether to include resource details (default: true)',
              },
            },
            required: [],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      console.error(`[Tool] Executing tool: ${request.params.name}`);
      
      try {
        switch (request.params.name) {
          case 'get_students':
            return await this.getStudents();
          case 'get_assignments':
            return await this.getAssignments();
          case 'get_quizzes':
            return await this.getQuizzes();
          case 'get_submissions':
            return await this.getSubmissions(request.params.arguments);
          case 'provide_feedback':
            return await this.provideFeedback(request.params.arguments);
          case 'get_submission_content':
            return await this.getSubmissionContent(request.params.arguments);
          case 'get_quiz_grade':
            return await this.getQuizGrade(request.params.arguments);
          case 'get_courses':
            return await this.getCourses(request.params.arguments);
          case 'get_course_contents':
            return await this.getCourseContents(request.params.arguments);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        console.error('[Error]', error);
        if (axios.isAxiosError(error)) {
          return {
            content: [
              {
                type: 'text',
                text: `Moodle API error: ${
                  error.response?.data?.message || error.message
                }`,
              },
            ],
            isError: true,
          };
        }
        throw error;
      }
    });
  }

  private async getStudents() {
    console.error('[API] Requesting enrolled users');
    
    const response = await this.axiosInstance.get('', {
      params: {
        wsfunction: 'core_enrol_get_enrolled_users',
        courseid: MOODLE_COURSE_ID,
      },
    });

    const students = response.data
      .filter((user: any) => user.roles.some((role: any) => role.shortname === 'student'))
      .map((student: any) => ({
        id: student.id,
        username: student.username,
        firstname: student.firstname,
        lastname: student.lastname,
        email: student.email,
      }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(students, null, 2),
        },
      ],
    };
  }

  private async getAssignments() {
    console.error('[API] Requesting assignments');
    
    const response = await this.axiosInstance.get('', {
      params: {
        wsfunction: 'mod_assign_get_assignments',
        courseids: [MOODLE_COURSE_ID],
      },
    });

    const assignments = response.data.courses[0]?.assignments || [];
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(assignments, null, 2),
        },
      ],
    };
  }

  private async getQuizzes() {
    console.error('[API] Requesting quizzes');
    
    const response = await this.axiosInstance.get('', {
      params: {
        wsfunction: 'mod_quiz_get_quizzes_by_courses',
        courseids: [MOODLE_COURSE_ID],
      },
    });

    const quizzes = response.data.quizzes || [];
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(quizzes, null, 2),
        },
      ],
    };
  }

  private async getSubmissions(args: any) {
    const studentId = args.studentId;
    const assignmentId = args.assignmentId;
    
    console.error(`[API] Requesting submissions${studentId ? ` for student ${studentId}` : ''}`);
    
    // First, get all assignments
    const assignmentsResponse = await this.axiosInstance.get('', {
      params: {
        wsfunction: 'mod_assign_get_assignments',
        courseids: [MOODLE_COURSE_ID],
      },
    });

    const assignments = assignmentsResponse.data.courses[0]?.assignments || [];
    
    // If an assignment ID was specified, filter only that assignment
    const targetAssignments = assignmentId
      ? assignments.filter((a: any) => a.id === assignmentId)
      : assignments;
    
    if (targetAssignments.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No assignments found for the specified criteria.',
          },
        ],
      };
    }

    // For each assignment, get all submissions
    const submissionsPromises = targetAssignments.map(async (assignment: any) => {
      const submissionsResponse = await this.axiosInstance.get('', {
        params: {
          wsfunction: 'mod_assign_get_submissions',
          assignmentids: [assignment.id],
        },
      });

      const submissions = submissionsResponse.data.assignments[0]?.submissions || [];
      
      // Get grades for this assignment
      const gradesResponse = await this.axiosInstance.get('', {
        params: {
          wsfunction: 'mod_assign_get_grades',
          assignmentids: [assignment.id],
        },
      });

      const grades = gradesResponse.data.assignments[0]?.grades || [];
      
      // If a student ID was specified, filter only their submissions
      const targetSubmissions = studentId
        ? submissions.filter((s: any) => s.userid === studentId)
        : submissions;
      
      // Process each submission
      const processedSubmissions = targetSubmissions.map((submission: any) => {
        const studentGrade = grades.find((g: any) => g.userid === submission.userid);
        
        return {
          userid: submission.userid,
          status: submission.status,
          timemodified: new Date(submission.timemodified * 1000).toISOString(),
          grade: studentGrade ? studentGrade.grade : 'Not graded',
        };
      });
      
      return {
        assignment: assignment.name,
        assignmentId: assignment.id,
        submissions: processedSubmissions.length > 0 ? processedSubmissions : 'No submissions',
      };
    });

    const results = await Promise.all(submissionsPromises);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  private async provideFeedback(args: any) {
    if (!args.studentId || !args.assignmentId || !args.feedback) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Student ID, Assignment ID, and feedback are required'
      );
    }

    console.error(`[API] Providing feedback for student ${args.studentId} on assignment ${args.assignmentId}`);
    
    const response = await this.axiosInstance.get('', {
      params: {
        wsfunction: 'mod_assign_save_grade',
        assignmentid: args.assignmentId,
        userid: args.studentId,
        grade: args.grade || 0,
        attemptnumber: -1, // Last attempt
        addattempt: 0,
        workflowstate: 'released',
        applytoall: 0,
        plugindata: {
          assignfeedbackcomments_editor: {
            text: args.feedback,
            format: 1, // HTML Format
          },
        },
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `Feedback successfully provided for student ${args.studentId} on assignment ${args.assignmentId}.`,
        },
      ],
    };
  }

  private async getSubmissionContent(args: any) {
    if (!args.studentId || !args.assignmentId) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Student ID and Assignment ID are required'
      );
    }

    console.error(`[API] Requesting submission content for student ${args.studentId} on assignment ${args.assignmentId}`);
    
    try {
      // Use the mod_assign_get_submission_status function to get detailed content
      const response = await this.axiosInstance.get('', {
        params: {
          wsfunction: 'mod_assign_get_submission_status',
          assignid: args.assignmentId,
          userid: args.studentId,
        },
      });

      // Process the response to extract relevant content
      const submissionData = response.data.submission || {};
      const plugins = response.data.lastattempt?.submission?.plugins || [];
      
      // Extract submission text and attachments
      let submissionText = '';
      const files = [];
      
      for (const plugin of plugins) {
        // Process the online text plugin
        if (plugin.type === 'onlinetext') {
          const textField = plugin.editorfields?.find((field: any) => field.name === 'onlinetext');
          if (textField) {
            submissionText = textField.text || '';
          }
        }
        
        // Process the file plugin
        if (plugin.type === 'file') {
          const filesList = plugin.fileareas?.find((area: any) => area.area === 'submission_files');
          if (filesList && filesList.files) {
            for (const file of filesList.files) {
              files.push({
                filename: file.filename,
                fileurl: file.fileurl,
                filesize: file.filesize,
                filetype: file.mimetype,
              });
            }
          }
        }
      }
      
      // Build the response object
      const submissionContent = {
        assignment: args.assignmentId,
        userid: args.studentId,
        status: submissionData.status || 'unknown',
        submissiontext: submissionText,
        plugins: [
          {
            type: 'onlinetext',
            content: submissionText,
          },
          {
            type: 'file',
            files: files,
          },
        ],
        timemodified: submissionData.timemodified || 0,
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(submissionContent, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error('[Error]', error);
      if (axios.isAxiosError(error)) {
        return {
          content: [
            {
              type: 'text',
              text: `Error getting submission content: ${
                error.response?.data?.message || error.message
              }`,
            },
          ],
          isError: true,
        };
      }
      throw error;
    }
  }

  private async getQuizGrade(args: any) {
    if (!args.studentId || !args.quizId) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Student ID and Quiz ID are required'
      );
    }

    console.error(`[API] Requesting quiz grade for student ${args.studentId} on quiz ${args.quizId}`);
    
    try {
      const response = await this.axiosInstance.get('', {
        params: {
          wsfunction: 'mod_quiz_get_user_best_grade',
          quizid: args.quizId,
          userid: args.studentId,
        },
      });

      // Process the response
      const result = {
        quizId: args.quizId,
        studentId: args.studentId,
        hasGrade: response.data.hasgrade,
        grade: response.data.hasgrade ? response.data.grade : 'Not graded',
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error('[Error]', error);
      if (axios.isAxiosError(error)) {
        return {
          content: [
            {
              type: 'text',
              text: `Error getting the quiz grade: ${
                error.response?.data?.message || error.message
              }`,
            },
          ],
          isError: true,
        };
      }
      throw error;
    }
  }

  private async getCourses(args: any) {
    console.error('[API] Requesting all courses');
    
    try {
      // Build parameters for the API call
      const params: any = {
        wsfunction: 'core_course_get_courses',
        moodlewsrestformat: 'json'
      };
      
      // Add optional filters
      if (args.categoryId) {
        params.categoryid = args.categoryId;
      }
      
      if (args.searchTerm) {
        params.search = args.searchTerm;
      }
      
      if (args.limit) {
        params.limit = args.limit;
      }
      
      const response = await this.axiosInstance.get('', { params });
      
      if (response.data && response.data.exception) {
        return {
          content: [
            {
              type: 'text',
              text: `Moodle API error: ${response.data.message || 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
      
      // Process and format the courses data
      const courses = Array.isArray(response.data) ? response.data : [];
      const limit = args.limit || 100;
      const limitedCourses = courses.slice(0, limit);
      
      // Create summary statistics
      const summary = {
        totalCourses: courses.length,
        returnedCourses: limitedCourses.length,
        categories: [...new Set(courses.map((c: any) => c.categoryid))].length,
        activeCourses: courses.filter((c: any) => c.visible).length,
        inactiveCourses: courses.filter((c: any) => !c.visible).length
      };
      
      // Format courses for better readability
      const formattedCourses = limitedCourses.map((course: any) => ({
        id: course.id,
        shortname: course.shortname,
        fullname: course.fullname,
        categoryid: course.categoryid,
        startdate: course.startdate ? new Date(course.startdate * 1000).toISOString() : null,
        enddate: course.enddate ? new Date(course.enddate * 1000).toISOString() : null,
        visible: course.visible,
        summary: course.summary ? course.summary.substring(0, 100) + '...' : null,
        timecreated: course.timecreated ? new Date(course.timecreated * 1000).toISOString() : null,
        timemodified: course.timemodified ? new Date(course.timemodified * 1000).toISOString() : null
      }));
      
      const result = {
        summary,
        courses: formattedCourses
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error('[Error]', error);
      if (axios.isAxiosError(error)) {
        return {
          content: [
            {
              type: 'text',
              text: `Error getting courses: ${
                error.response?.data?.message || error.message
              }`,
            },
          ],
          isError: true,
        };
      }
      throw error;
    }
  }

  private async getCourseContents(args: any) {
    const courseId = args.courseId || MOODLE_COURSE_ID;
    const includeModules = args.includeModules !== false; // default to true
    const includeResources = args.includeResources !== false; // default to true
    
    console.error(`[API] Requesting course contents for course ${courseId}`);
    
    try {
      const response = await this.axiosInstance.get('', {
        params: {
          wsfunction: 'core_course_get_contents',
          courseid: courseId,
        },
      });

      if (response.data && response.data.exception) {
        return {
          content: [
            {
              type: 'text',
              text: `Moodle API error: ${response.data.message || 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }

      // Process and format the course contents
      const sections = Array.isArray(response.data) ? response.data : [];
      
      // Create summary statistics
      const summary = {
        courseId: courseId,
        totalSections: sections.length,
        totalModules: sections.reduce((total: number, section: any) => 
          total + (section.modules ? section.modules.length : 0), 0),
        totalResources: sections.reduce((total: number, section: any) => 
          total + (section.modules ? section.modules.filter((m: any) => m.modname === 'resource').length : 0), 0),
        totalActivities: sections.reduce((total: number, section: any) => 
          total + (section.modules ? section.modules.filter((m: any) => m.modname !== 'resource').length : 0), 0),
        hasVisibleSections: sections.some((s: any) => s.visible),
        hasHiddenSections: sections.some((s: any) => !s.visible)
      };

      // Format sections for better readability
      const formattedSections = sections.map((section: any) => {
        const formattedSection: any = {
          id: section.id,
          name: section.name,
          summary: section.summary ? section.summary.substring(0, 150) + '...' : null,
          visible: section.visible,
          section: section.section,
          summaryformat: section.summaryformat,
          modules: []
        };

        // Add modules if requested and available
        if (includeModules && section.modules && Array.isArray(section.modules)) {
          formattedSection.modules = section.modules.map((module: any) => {
            const formattedModule: any = {
              id: module.id,
              name: module.name,
              modname: module.modname,
              modplural: module.modplural,
              instance: module.instance,
              visible: module.visible,
              visibleoncoursepage: module.visibleoncoursepage,
              indent: module.indent,
              url: module.url,
              description: module.description ? module.description.substring(0, 100) + '...' : null,
              descriptionformat: module.descriptionformat
            };

            // Add resource-specific information if requested
            if (includeResources && module.modname === 'resource' && module.contents) {
              formattedModule.resourceInfo = {
                fileCount: module.contents.length,
                fileTypes: [...new Set(module.contents.map((c: any) => c.mimetype))],
                totalSize: module.contents.reduce((total: number, c: any) => total + (c.filesize || 0), 0)
              };
            }

            // Add activity-specific information
            if (module.modname !== 'resource') {
              formattedModule.activityInfo = {
                type: module.modname,
                hasCompletion: module.completion !== undefined,
                completion: module.completion,
                hasGrade: module.grade !== undefined,
                grade: module.grade
              };
            }

            return formattedModule;
          });
        }

        return formattedSection;
      });

      const result = {
        summary,
        sections: formattedSections
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error('[Error]', error);
      if (axios.isAxiosError(error)) {
        return {
          content: [
            {
              type: 'text',
              text: `Error getting course contents: ${
                error.response?.data?.message || error.message
              }`,
            },
          ],
          isError: true,
        };
      }
      throw error;
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Moodle MCP server running on stdio');
  }
}

const server = new MoodleMcpServer();
server.run().catch(console.error);
