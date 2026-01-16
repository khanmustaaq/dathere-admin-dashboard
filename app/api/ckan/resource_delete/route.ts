import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: { message: 'Resource ID is required' } 
        },
        { status: 400 }
      );
    }

    const ckanResponse = await fetch(
      `${process.env.CKAN_API_URL}/api/3/action/resource_delete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.CKAN_API_KEY!,
        },
        body: JSON.stringify({ id }),
      }
    );

    const data = await ckanResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Resource delete error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: error.message || 'Failed to delete resource' 
        } 
      },
      { status: 500 }
    );
  }
}