import type { Project } from "../types";
import { restoreProject } from "./project";
export const DATABASE = "khmer-shop-story-maker-v1";
let connection: Promise<IDBDatabase> | undefined;
function open() {
  connection ??= new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open(DATABASE, 1);
    r.onupgradeneeded = () =>
      r.result.createObjectStore("projects", { keyPath: "id" });
    r.onsuccess = () => {
      r.result.onversionchange = () => {
        r.result.close();
        connection = undefined;
      };
      resolve(r.result);
    };
    r.onerror = () => {
      connection = undefined;
      reject(r.error);
    };
    r.onblocked = () => {
      connection = undefined;
      reject(new Error("Database blocked"));
    };
  });
  return connection;
}
export async function saveProject(project: Project): Promise<void> {
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("projects", "readwrite");
    tx.objectStore("projects").put(project);
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
    tx.onerror = () => reject(tx.error);
  });
}
export async function listProjects(): Promise<Project[]> {
  const db = await open();
  const values = await new Promise<unknown[]>((resolve, reject) => {
    const r = db.transaction("projects").objectStore("projects").getAll();
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  return values
    .map(restoreProject)
    .filter((p): p is Project => !!p)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
export async function deleteProject(id: string): Promise<void> {
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("projects", "readwrite");
    tx.objectStore("projects").delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
export function closeDatabase() {
  connection?.then((db) => db.close()).catch(() => {});
  connection = undefined;
}
