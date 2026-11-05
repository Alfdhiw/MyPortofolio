import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, join, relative, isAbsolute } from 'node:path';
import { renderHome, renderProject, publishedProjects } from './templates.mjs';

export const root = fileURLToPath(new URL('../', import.meta.url));
export function validateData(data) {
  if (!data.profile?.fullName || !data.profile.portrait || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.profile.email)) throw new Error('A real profile, portrait, and valid contact email are required.');
  const slugs = new Set();
  for (const project of data.projects) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug) || slugs.has(project.slug)) throw new Error(`Invalid or duplicate slug: ${project.slug}`);
    slugs.add(project.slug);
    if (!['real', 'exploration'].includes(project.projectType) || !project.title || !project.coverImage?.alt || !Array.isArray(project.sections)) throw new Error(`Incomplete project: ${project.slug}`);
    const nonEmptyText = value => typeof value === 'string' && value.trim().length > 0;
    if (!project.sections.length || project.sections.some(section => !section || !nonEmptyText(section.heading) || !Array.isArray(section.paragraphs) || !section.paragraphs.length || !section.paragraphs.every(nonEmptyText) || (section.images !== undefined && !Array.isArray(section.images)))) throw new Error(`Invalid case-study sections: ${project.slug}`);
    for (const field of ['services', 'tools']) if (!Array.isArray(project[field]) || !project[field].every(nonEmptyText)) throw new Error(`Invalid project ${field}: ${project.slug}`);
    for (const field of ['role', 'timelineText']) if (project[field] !== undefined && !nonEmptyText(project[field])) throw new Error(`Invalid project ${field}: ${project.slug}`);
    if (project.liveUrl && !/^https?:$/.test(new URL(project.liveUrl).protocol)) throw new Error(`Invalid live URL: ${project.slug}`);
  }
  for (const social of data.profile.socialLinks) if (!/^https?:$/.test(new URL(social.url).protocol)) throw new Error('Invalid social URL.');
  const ids = data.services.map(service => service.id);
  if (new Set(ids).size !== ids.length || ids.some(id => !/^[a-z0-9-]+$/.test(id))) throw new Error('Service IDs must be unique and safe.');
  for (const item of data.experience) {
    const descriptions = Array.isArray(item.description) ? item.description : [item.description];
    if (!descriptions.length || descriptions.some(text => typeof text !== 'string' || !text.trim())) throw new Error(`Invalid experience description: ${item.id}`);
    if (item.galleryImages !== undefined && (!Array.isArray(item.galleryImages) || !item.previewImage || item.galleryImages.some(media => !media || typeof media.src !== 'string' || !media.src.trim() || typeof media.alt !== 'string' || !media.alt.trim()))) throw new Error(`Invalid experience gallery: ${item.id}`);
    const mediaPaths = [item.previewImage, ...(item.galleryImages || [])].filter(Boolean).map(media => media.src);
    if (new Set(mediaPaths).size !== mediaPaths.length) throw new Error(`Duplicate experience gallery image: ${item.id}`);
    if (!/^\d{4}(?:-\d{2})?$/.test(item.startDate) || (!item.isCurrent && !/^\d{4}(?:-\d{2})?$/.test(item.endDate))) throw new Error(`Invalid experience date: ${item.id}`);
    if (item.projectSlug && !slugs.has(item.projectSlug)) throw new Error(`Unknown related project: ${item.projectSlug}`);
  }
}
async function hydrateMedia(value) {
  if (Array.isArray(value)) return Promise.all(value.map(hydrateMedia));
  if (!value || typeof value !== 'object') return value;
  const object = Object.fromEntries(await Promise.all(Object.entries(value).map(async ([key, item]) => [key, await hydrateMedia(item)])));
  if (typeof object.src === 'string') {
    const absolute = resolve(root, object.src);
    const fromRoot = relative(root, absolute);
    if (fromRoot.startsWith('..') || isAbsolute(fromRoot)) throw new Error(`Asset escapes project directory: ${object.src}`);
    await access(absolute);
    const bytes = await readFile(absolute);
    if (bytes.subarray(1, 4).toString() === 'PNG') { object.width = bytes.readUInt32BE(16); object.height = bytes.readUInt32BE(20); }
    if (!object.width || !object.height || !object.alt) throw new Error(`Media needs verified dimensions and alt text: ${object.src}`);
  }
  return object;
}
export async function loadData() {
  const data = JSON.parse(await readFile(join(root, 'content/portfolio.json'), 'utf8'));
  validateData(data);
  return hydrateMedia(data);
}
export async function build() {
  const data = await loadData();
  const outputs = new Map([['index.html', renderHome(data)]]);
  for (const project of publishedProjects(data)) outputs.set(`work/${project.slug}/index.html`, renderProject(data, project));
  for (const [name, content] of outputs) {
    const destination = join(root, name);
    await mkdir(resolve(destination, '..'), { recursive: true });
    await writeFile(destination, content, 'utf8');
  }
  console.log(`Built homepage + ${outputs.size - 1} project pages from content/portfolio.json.`);
  return outputs;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await build();
