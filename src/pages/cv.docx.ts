import type { APIContext } from 'astro';

export const prerender = false;

const ASSET_PATH = '/cv/CV_Charles_Joshua_Uy.docx';
const DOWNLOAD_NAME = 'CV_CJ-Uy_Updated_2026-07-25.docx';

export async function GET({ request }: APIContext) {
  const asset = await fetch(new URL(ASSET_PATH, request.url));
  const headers = new Headers(asset.headers);

  headers.set('content-type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  headers.set('content-disposition', `attachment; filename="${DOWNLOAD_NAME}"`);

  return new Response(asset.body, { status: asset.status, headers });
}
