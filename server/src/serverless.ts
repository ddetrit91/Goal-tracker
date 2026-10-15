import app from './app';

const handler = (req: Request) => {
  console.log(`[API] ${req.method} ${req.url}`);
  return app.fetch(req);
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;

export default handler;
