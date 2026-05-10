import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.csv');
const PAGES_FILE = path.join(DATA_DIR, 'pages.csv');
const NOTES_FILE = path.join(DATA_DIR, 'notes.csv');
const PASSWORDS_FILE = path.join(DATA_DIR, 'passwords.csv');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.csv');

// Ensure files exist
function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(PROJECTS_FILE)) {
    const initialProjects = [
      ['noteflow', 'NoteFlow', 'Zap', 'development', 'Next-gen productivity orchestration layer'],
      ['braindump', 'BrainDump', 'Brain', 'fixing', 'Raw stream of consciousness capture']
    ];
    fs.writeFileSync(PROJECTS_FILE, stringify(initialProjects, { header: false }));
  }
  
  if (!fs.existsSync(PAGES_FILE)) {
    const initialPages = [
      ['nf-meeting', 'noteflow', 'meeting-notes'],
      ['nf-todo', 'noteflow', 'todo-list'],
      ['nf-ideas', 'noteflow', 'ideas'],
      ['bd-scratch', 'braindump', 'scratchpad'],
      ['bd-reading', 'braindump', 'reading-list']
    ];
    fs.writeFileSync(PAGES_FILE, stringify(initialPages, { header: false }));
  }
  
  if (!fs.existsSync(NOTES_FILE)) {
    const initialNotes = [
      ['1', 'nf-meeting', 'Antigravity', 'Welcome to your new Discord-inspired note-taking app!', 'Today at 9:41 AM'],
      ['2', 'nf-meeting', 'Antigravity', 'You can switch between projects on the left rail.', 'Today at 9:42 AM'],
      ['3', 'nf-meeting', 'Antigravity', 'Each project has its own set of pages.', 'Today at 9:43 AM']
    ];
    fs.writeFileSync(NOTES_FILE, stringify(initialNotes, { header: false }));
  }

  if (!fs.existsSync(PASSWORDS_FILE)) {
    const initialPasswords = [
      ['1', 'Github', 'willi@example.com', 'password123', 'https://github.com'],
      ['2', 'Discord', 'willi_dev', 'discord_pass', 'https://discord.com']
    ];
    fs.writeFileSync(PASSWORDS_FILE, stringify(initialPasswords, { header: false }));
  }

  if (!fs.existsSync(SETTINGS_FILE)) {
    const initialSettings = [['github_username', '']];
    fs.writeFileSync(SETTINGS_FILE, stringify(initialSettings, { header: false }));
  }
}

const readCSV = (file: string) => {
  initDB();
  try {
    const content = fs.readFileSync(file, 'utf-8');
    return parse(content, { columns: false }) || [];
  } catch (error) {
    console.error(`Error reading ${file}:`, error);
    return [];
  }
};

const writeCSV = (file: string, data: any[][]) => {
  initDB();
  try {
    fs.writeFileSync(file, stringify(data, { header: false }));
  } catch (error) {
    console.error(`Error writing to ${file}:`, error);
  }
};

export type ProjectData = { id: string; name: string; iconName: string; status: 'development' | 'fixing' | 'stable'; description: string };
export type PageData = { id: string; projectId: string; name: string; status?: string };
export type NoteData = { id: string; pageId: string; user: string; content: string; timestamp: string; status?: string };
export type PasswordData = { id: string; title: string; username: string; password: string; url: string };
export type SettingsData = { key: string; value: string };

export const getProjects = (): ProjectData[] => readCSV(PROJECTS_FILE).map((r: string[]) => ({ id: r[0], name: r[1], iconName: r[2], status: (r[3] || 'stable') as any, description: r[4] || '' }));
export const saveProjects = (projects: ProjectData[]) => writeCSV(PROJECTS_FILE, projects.map(p => [p.id, p.name, p.iconName, p.status, p.description]));

export const getPages = (): PageData[] => readCSV(PAGES_FILE).map((r: string[]) => ({ id: r[0], projectId: r[1], name: r[2], status: r[3] || 'in-progress' }));
export const savePages = (pages: PageData[]) => writeCSV(PAGES_FILE, pages.map(p => [p.id, p.projectId, p.name, p.status || 'in-progress']));

export const getNotes = (): NoteData[] => readCSV(NOTES_FILE).map((r: string[]) => ({ id: r[0], pageId: r[1], user: r[2], content: r[3], timestamp: r[4], status: r[5] || 'in-progress' }));
export const saveNotes = (notes: NoteData[]) => writeCSV(NOTES_FILE, notes.map(n => [n.id, n.pageId, n.user, n.content, n.timestamp, n.status || 'in-progress']));

export const getPasswords = (): PasswordData[] => readCSV(PASSWORDS_FILE).map((r: string[]) => ({ id: r[0], title: r[1], username: r[2], password: r[3], url: r[4] }));
export const savePasswords = (passwords: PasswordData[]) => writeCSV(PASSWORDS_FILE, passwords.map(p => [p.id, p.title, p.username, p.password, p.url]));

export const getSettings = (): SettingsData[] => readCSV(SETTINGS_FILE).map((r: string[]) => ({ key: r[0], value: r[1] }));
export const saveSettings = (settings: SettingsData[]) => writeCSV(SETTINGS_FILE, settings.map(s => [s.key, s.value]));
