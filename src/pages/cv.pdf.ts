import type { APIContext } from 'astro';

export const prerender = false;

const ASSET_PATH = '/cv/CV_Charles_Joshua_Uy.pdf';
const DOWNLOAD_NAME = 'CV_CJ-Uy_Updated_2026-07-25.pdf';

export async function GET({ request }: APIContext) {
  const asset = await fetch(new URL(ASSET_PATH, request.url));
  const headers = new Headers(asset.headers);

  headers.set('content-type', 'application/pdf');
  headers.set('content-disposition', `inline; filename="${DOWNLOAD_NAME}"`);

  return new Response(asset.body, { status: asset.status, headers });
}
