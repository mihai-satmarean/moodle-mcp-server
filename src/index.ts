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

// Configuración de variables de entorno
const MOODLE_API_URL = process.env.MOODLE_API_URL;
const MOODLE_API_TOKEN = process.env.MOODLE_API_TOKEN;
const MOODLE_COURSE_ID = process.env.MOODLE_COURSE_ID;

// Verificar que las variables de entorno estén definidas
if (!MOODLE_API_URL) {
  throw new Error('MOODLE_API_URL environment variable is required');
}

if (!MOODLE_API_TOKEN) {
  throw new Error('MOODLE_API_TOKEN environment variable is required');
}

if (!MOODLE_COURSE_ID) {
  throw new Error('MOODLE_COURSE_ID environment variable is required');
}

// Interfaces para los tipos de datos
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
          description: 'Obtiene la lista de estudiantes inscritos en el curso configurado',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'get_assignments',
          description: 'Obtiene la lista de tareas asignadas en el curso configurado',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'get_quizzes',
          description: 'Obtiene la lista de quizzes en el curso configurado',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'get_student_submissions',
          description: 'Obtiene las entregas de tareas de un estudiante específico',
          inputSchema: {
            type: 'object',
            properties: {
              studentId: {
                type: 'number',
                description: 'ID del estudiante',
              },
              assignmentId: {
                type: 'number',
                description: 'ID opcional de la tarea. Si no se proporciona, se devolverán todas las entregas',
              },
            },
            required: ['studentId'],
          },
        },
        {
          name: 'provide_feedback',
          description: 'Proporciona feedback sobre una tarea entregada por un estudiante',
          inputSchema: {
            type: 'object',
            properties: {
              studentId: {
                type: 'number',
                description: 'ID del estudiante',
              },
              assignmentId: {
                type: 'number',
                description: 'ID de la tarea',
              },
              grade: {
                type: 'number',
                description: 'Calificación numérica a asignar',
              },
              feedback: {
                type: 'string',
                description: 'Texto del feedback a proporcionar',
              },
            },
            required: ['studentId', 'assignmentId', 'feedback'],
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
          case 'get_student_submissions':
            return await this.getStudentSubmissions(request.params.arguments);
          case 'provide_feedback':
            return await this.provideFeedback(request.params.arguments);
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

  private async getStudentSubmissions(args: any) {
    if (!args.studentId) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Student ID is required'
      );
    }

    console.error(`[API] Requesting submissions for student ${args.studentId}`);
    
    // Primero obtenemos todas las tareas
    const assignmentsResponse = await this.axiosInstance.get('', {
      params: {
        wsfunction: 'mod_assign_get_assignments',
        courseids: [MOODLE_COURSE_ID],
      },
    });

    const assignments = assignmentsResponse.data.courses[0]?.assignments || [];
    
    // Si se especificó un ID de tarea, filtramos solo esa tarea
    const targetAssignments = args.assignmentId 
      ? assignments.filter((a: any) => a.id === args.assignmentId)
      : assignments;
    
    if (targetAssignments.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No se encontraron tareas para el criterio especificado.',
          },
        ],
      };
    }

    // Para cada tarea, obtenemos las entregas del estudiante
    const submissionsPromises = targetAssignments.map(async (assignment: any) => {
      const submissionsResponse = await this.axiosInstance.get('', {
        params: {
          wsfunction: 'mod_assign_get_submissions',
          assignmentids: [assignment.id],
        },
      });

      const submissions = submissionsResponse.data.assignments[0]?.submissions || [];
      const studentSubmission = submissions.find((s: any) => s.userid === args.studentId);
      
      if (!studentSubmission) {
        return {
          assignment: assignment.name,
          assignmentId: assignment.id,
          submission: 'No entregado',
        };
      }

      // Obtenemos las calificaciones
      const gradesResponse = await this.axiosInstance.get('', {
        params: {
          wsfunction: 'mod_assign_get_grades',
          assignmentids: [assignment.id],
        },
      });

      const grades = gradesResponse.data.assignments[0]?.grades || [];
      const studentGrade = grades.find((g: any) => g.userid === args.studentId);
      
      return {
        assignment: assignment.name,
        assignmentId: assignment.id,
        submission: {
          status: studentSubmission.status,
          timemodified: new Date(studentSubmission.timemodified * 1000).toISOString(),
          grade: studentGrade ? studentGrade.grade : 'No calificado',
        },
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
        attemptnumber: -1, // Último intento
        addattempt: 0,
        workflowstate: 'released',
        applytoall: 0,
        plugindata: {
          assignfeedbackcomments_editor: {
            text: args.feedback,
            format: 1, // Formato HTML
          },
        },
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `Feedback proporcionado correctamente para el estudiante ${args.studentId} en la tarea ${args.assignmentId}.`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Moodle MCP server running on stdio');
  }
}

const server = new MoodleMcpServer();
server.run().catch(console.error);
