import { NextRequest, NextResponse } from 'next/server';

const CKAN_URL = 'http://localhost:5050/api/3/action';
const CKAN_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJqNzNzZkI0MEdWNm5LWTV4dUFBa2RmdzJXNkY4aDM3bFNYU3BiUi1GRXpJIiwiaWF0IjoxNzYzMzY4MjU5fQ.RK9MGnOeh-IloTd8AN4LAO4M_uuCzspyckPx3lo7vak'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string[] }> }  // Changed this
) {
  try {
    const { action: actionArray } = await params;  // Await params
    const action = actionArray.join('/');
    const body = await request.json();

    console.log('Proxying to CKAN:', `${CKAN_URL}/${action}`);

    const response = await fetch(`${CKAN_URL}/${action}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': CKAN_API_KEY,
      },
      body: JSON.stringify(body),
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
