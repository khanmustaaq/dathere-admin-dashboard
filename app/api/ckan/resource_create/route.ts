import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');

    let body: any;
    let isFileUpload = false;

    // Check if this is a file upload (multipart/form-data) or JSON
    if (contentType?.includes('multipart/form-data')) {
      isFileUpload = true;
      // Get form data for file upload
      const formData = await request.formData();
      
      // Forward the form data to CKAN
      const ckanResponse = await fetch(
        `${process.env.CKAN_API_URL}/api/3/action/resource_create`,
        {
          method: 'POST',
          headers: {
            'Authorization': process.env.CKAN_API_KEY!,
          },
          body: formData,
        }
      );

      const data = await ckanResponse.json();
      return NextResponse.json(data);
      
    } else {
      // JSON request for URL-based resources
      body = await request.json();
      
      const ckanResponse = await fetch(
        `${process.env.CKAN_API_URL}/api/3/action/resource_create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.CKAN_API_KEY!,
          },
          body: JSON.stringify(body),
        }
      );

      const data = await ckanResponse.json();
      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.error('Resource create error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: error.message || 'Failed to create resource' 
        } 
      },
      { status: 500 }
    );
  }
}