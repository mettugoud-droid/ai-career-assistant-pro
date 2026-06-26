import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { ParsedResume, ResumeFileType } from '@career-assistant/shared';

const SKILL_KEYWORDS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin',
  'React', 'Angular', 'Vue', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'FastAPI',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'CI/CD', 'Git',
  'PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Elasticsearch', 'DynamoDB', 'Firebase',
  'GraphQL', 'REST', 'gRPC', 'Microservices', 'Serverless', 'Machine Learning', 'Deep Learning',
  'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision', 'Data Science', 'Pandas', 'NumPy',
  'Linux', 'Nginx', 'Apache', 'RabbitMQ', 'Kafka', 'WebSocket', 'OAuth', 'JWT',
  'Figma', 'Tailwind CSS', 'SASS', 'Webpack', 'Vite', 'Jest', 'Cypress', 'Playwright',
  'Agile', 'Scrum', 'Jira', 'Confluence', 'Notion',
];

export class ResumeParserService {
  static async parseResume(buffer: Buffer, fileType: ResumeFileType): Promise<{ text: string; structured: ParsedResume }> {
    let text = '';

    switch (fileType) {
      case ResumeFileType.PDF:
        text = await this.parsePdf(buffer);
        break;
      case ResumeFileType.DOCX:
      case ResumeFileType.DOC:
        text = await this.parseDocx(buffer);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    const structured = this.extractStructuredData(text);
    return { text, structured };
  }

  static async parsePdf(buffer: Buffer): Promise<string> {
    const data = await pdfParse(buffer);
    return data.text.replace(/\s+/g, ' ').trim();
  }

  static async parseDocx(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.replace(/\s+/g, ' ').trim();
  }

  static extractStructuredData(text: string): ParsedResume {
    const emailRegex = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/gi;
    const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/gi;

    const emails = text.match(emailRegex) || [];
    const phones = text.match(phoneRegex) || [];
    const linkedinUrls = text.match(linkedinRegex) || [];
    const githubUrls = text.match(githubRegex) || [];

    const foundSkills = SKILL_KEYWORDS.filter(skill =>
      text.toLowerCase().includes(skill.toLowerCase())
    );

    const technicalSkills = foundSkills.filter(s =>
      !['Agile', 'Scrum', 'Jira', 'Confluence', 'Notion'].includes(s)
    );
    const softSkills: string[] = [];
    const tools = foundSkills.filter(s =>
      ['Docker', 'Kubernetes', 'Git', 'Jira', 'Confluence', 'Figma', 'Notion', 'Jenkins', 'Webpack', 'Vite'].includes(s)
    );
    const frameworks = foundSkills.filter(s =>
      ['React', 'Angular', 'Vue', 'Next.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'FastAPI', 'TensorFlow', 'PyTorch'].includes(s)
    );

    // Extract name (first line heuristic)
    const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
    const name = lines[0]?.replace(/[^a-zA-Z\s]/g, '').trim() || 'Unknown';

    return {
      personalInfo: {
        name,
        email: emails[0] || '',
        phone: phones[0],
        linkedinUrl: linkedinUrls[0],
        githubUrl: githubUrls[0],
      },
      skills: {
        technical: technicalSkills,
        soft: softSkills,
        tools,
        frameworks,
      },
      experience: [],
      education: [],
    };
  }
}
