"use server";

import { 
  getProjects, 
  saveProjects, 
  getPages, 
  savePages, 
  getNotes, 
  saveNotes,
  getPasswords,
  savePasswords,
  getSettings,
  saveSettings,
  ProjectData,
  PageData,
  NoteData,
  PasswordData,
  SettingsData
} from "@/lib/db";
import { revalidatePath } from "next/cache";
import path from "path";
import fs from "fs";

export async function fetchAllData() {
  return {
    projects: getProjects(),
    pages: getPages(),
    notes: getNotes(),
    passwords: getPasswords(),
    settings: getSettings()
  };
}

export async function addProject(project: ProjectData) {
  const projects = getProjects();
  projects.push(project);
  saveProjects(projects);
  revalidatePath("/");
}

export async function deleteProject(id: string) {
  const projects = getProjects().filter(p => p.id !== id);
  const pages = getPages().filter(p => p.projectId !== id);
  saveProjects(projects);
  savePages(pages);
  revalidatePath("/");
}

export async function addPage(page: PageData) {
  const pages = getPages();
  pages.push(page);
  savePages(pages);
  revalidatePath("/");
}

export async function deletePage(id: string) {
  const pages = getPages().filter(p => p.id !== id);
  savePages(pages);
  revalidatePath("/");
}

export async function addNote(note: NoteData) {
  const notes = getNotes();
  notes.push(note);
  saveNotes(notes);
  revalidatePath("/");
}

export async function deleteNote(id: string) {
  const notes = getNotes().filter(n => n.id !== id);
  saveNotes(notes);
  revalidatePath("/");
}

export async function updateProjectIcon(id: string, iconName: string) {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === id);
  if (index !== -1) {
    projects[index].iconName = iconName;
    saveProjects(projects);
  }
  revalidatePath("/");
}

export async function reorderNotes(pageId: string, orderedIds: string[]) {
  const notes = getNotes();
  const otherNotes = notes.filter(n => n.pageId !== pageId);
  const pageNotes = notes.filter(n => n.pageId === pageId);
  const reordered = orderedIds.map(id => pageNotes.find(n => n.id === id)).filter(Boolean) as NoteData[];
  saveNotes([...otherNotes, ...reordered]);
  revalidatePath("/");
}

export async function addPassword(password: PasswordData) {
  const passwords = getPasswords();
  passwords.push(password);
  savePasswords(passwords);
  revalidatePath("/");
}

export async function deletePassword(id: string) {
  const passwords = getPasswords().filter(p => p.id !== id);
  savePasswords(passwords);
  revalidatePath("/");
}

export async function updatePassword(updated: PasswordData) {
  const passwords = getPasswords();
  const index = passwords.findIndex(p => p.id === updated.id);
  if (index !== -1) {
    passwords[index] = updated;
    savePasswords(passwords);
  }
  revalidatePath("/");
}

export async function updateSetting(key: string, value: string) {
  const settings = getSettings();
  const index = settings.findIndex(s => s.key === key);
  if (index !== -1) {
    settings[index].value = value;
  } else {
    settings.push({ key, value });
  }
  saveSettings(settings);
  revalidatePath("/");
}
export async function updateNoteStatus(id: string, status: "todo" | "in-progress" | "done" | "fixing") {
  const notes = getNotes();
  const index = notes.findIndex(n => n.id === id);
  if (index !== -1) {
    notes[index].status = status;
    saveNotes(notes);
  }
  revalidatePath("/");
}

export async function updatePageStatus(id: string, status: "todo" | "in-progress" | "done" | "fixing") {
  const pages = getPages();
  const index = pages.findIndex(p => p.id === id);
  if (index !== -1) {
    pages[index].status = status;
    savePages(pages);
  }
  revalidatePath("/");
}

export async function listDirectory(targetPath: string = ".") {
  const fullPath = path.resolve(process.cwd(), targetPath);
  try {
    const entries = fs.readdirSync(fullPath, { withFileTypes: true });
    return entries.map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory()
    }));
  } catch (error) {
    console.error("Error listing directory:", error);
    return [];
  }
}
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function runShellCommand(command: string, cwd: string = ".") {
  const fullPath = path.resolve(process.cwd(), cwd);
  try {
    const { stdout, stderr } = await execAsync(command, { cwd: fullPath });
    return {
      output: stdout || stderr,
      error: !!stderr,
      cwd: fullPath
    };
  } catch (error: any) {
    return {
      output: error.message,
      error: true,
      cwd: fullPath
    };
  }
}
