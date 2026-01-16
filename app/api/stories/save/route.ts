import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { slug, metadata, content, components } = await request.json();

    const portalJsPath = path.join(
      process.cwd(),
      '..',
      'portaljs-fresh-test',
      'content',
      'stories',
      slug
    );

    if (!fs.existsSync(portalJsPath)) {
      fs.mkdirSync(portalJsPath, { recursive: true });
    }

    fs.writeFileSync(path.join(portalJsPath, 'index.mdx'), content);
    fs.writeFileSync(
      path.join(portalJsPath, 'config.json'),
      JSON.stringify({ metadata, components }, null, 2)
    );

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error('Error saving story:', error);
    return NextResponse.json(
      { error: 'Failed to save story' },
      { status: 500 }
    );
  }
}
