import { NextRequest, NextResponse } from 'next/server';

const CKAN_URL = `${process.env.CKAN_API_URL}/api/3/action`;
const CKAN_API_KEY = process.env.CKAN_API_KEY || '';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string[] }> }
) {
  try {
    const { action: actionArray } = await params;
    const action = actionArray.join('/');
    
    const contentType = request.headers.get('content-type');
    
    let body;
    let headers: HeadersInit = {
      'Authorization': CKAN_API_KEY,
    };

    // Handle FormData (file uploads)
    if (contentType?.includes('multipart/form-data')) {
      body = await request.formData();
      // Don't set Content-Type for FormData - browser sets it with boundary
    } else {
      // Handle JSON
      body = JSON.stringify(await request.json());
      headers['Content-Type'] = 'application/json';
    }

    console.log('Proxying to CKAN:', `${CKAN_URL}/${action}`);

    const response = await fetch(`${CKAN_URL}/${action}`, {
      method: 'POST',
      headers,
      body,
    });

    const text = await response.text();
    console.log('CKAN response:', text);

    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ action: string[] }> }  // Changed this too
) {
  const { action: actionArray } = await params;  // Await params
  const action = actionArray.join('/');
  const { searchParams } = new URL(request.url);

  const response = await fetch(
    `${CKAN_URL}/${action}?${searchParams.toString()}`,
    {
      headers: { 
        'Authorization': CKAN_API_KEY 
      }
    }
  );

  const data = await response.json();
  return NextResponse.json(data);
}
