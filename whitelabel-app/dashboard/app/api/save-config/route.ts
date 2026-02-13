import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const slug = formData.get('slug') as string;
    const configContent = formData.get('configContent') as string;
    const iconFile = formData.get('icon') as File | null;
    const splashFile = formData.get('splash') as File | null;
    const adaptiveIconFile = formData.get('adaptiveIcon') as File | null;
    const faviconFile = formData.get('favicon') as File | null;

    if (!slug || !configContent) {
      return NextResponse.json(
        { error: 'Missing slug or config content' },
        { status: 400 }
      );
    }

    // Get project root (dashboard is one level deep from project root)
    const projectRoot = join(process.cwd(), '..');
    const configsDir = join(projectRoot, 'configs');
    const assetsDir = join(projectRoot, 'assets', slug);

    // Write config file
    const configPath = join(configsDir, `${slug}.config.js`);
    await writeFile(configPath, configContent, 'utf-8');

    // Create assets directory if it doesn't exist
    await mkdir(assetsDir, { recursive: true });

    // Write image files if they exist
    const files = [
      { file: iconFile, name: 'icon.png' },
      { file: splashFile, name: 'splash.png' },
      { file: adaptiveIconFile, name: 'adaptive-icon.png' },
      { file: faviconFile, name: 'favicon.png' },
    ];

    for (const { file, name } of files) {
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const imagePath = join(assetsDir, name);
        await writeFile(imagePath, buffer);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Configuration saved successfully!`,
      paths: {
        config: `configs/${slug}.config.js`,
        assets: `assets/${slug}/`,
      },
    });
  } catch (error: any) {
    console.error('Error saving config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save configuration' },
      { status: 500 }
    );
  }
}
