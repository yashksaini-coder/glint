import { docsLlms } from '@/lib/source';
import { withBase } from '@/lib/shared';

export const revalidate = false;

export async function GET() {
  return new Response(withBase(await docsLlms.index()));
}
