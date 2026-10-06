import { it, expect, afterAll } from "vitest";
import { newProject } from "../src/lib/project";
import {
  saveProject,
  listProjects,
  deleteProject,
  closeDatabase,
} from "../src/lib/storage";
afterAll(closeDatabase);
it("recovers photographs, QR and recordings after reopening the database", async () => {
  const p = newProject();
  p.business.shop = "Local merchant";
  p.khqr = new Blob(["privateQR"], { type: "image/png" });
  p.voice = new Blob(["voice"], { type: "audio/webm" });
  p.photos = [
    { id: "1", blob: new Blob(["product"]), x: 72, y: 21, zoom: 1.25 },
  ];
  await saveProject(p);
  closeDatabase();
  const restored = (await listProjects()).find((item) => item.id === p.id)!;
  expect(restored.business.shop).toBe(p.business.shop);
  expect(await restored.khqr!.text()).toBe("privateQR");
  expect(await restored.voice!.text()).toBe("voice");
  expect(restored.photos[0].x).toBe(72);
  expect(await restored.photos[0].blob.text()).toBe("product");
  await deleteProject(p.id);
  expect((await listProjects()).some((item) => item.id === p.id)).toBe(false);
});
