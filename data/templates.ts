export interface TemplateField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields?: TemplateField[];
  filename?: string;
  title?: string;
  aiPrompt?: string;
}

export const templates: DocumentTemplate[] = [];
