import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const ckanUrl = process.env.NEXT_PUBLIC_CKAN_URL || 'http://localhost:5050';
    const apiKey = process.env.CKAN_API_KEY;

    // Fetch datasets count
    const datasetsRes = await fetch(`${ckanUrl}/api/3/action/package_list`, {
      headers: {
        'Authorization': apiKey || '',
      },
    });
    const datasetsData = await datasetsRes.json();
    const totalDatasets = datasetsData.success ? datasetsData.result.length : 0;

    // Fetch users count (might need admin permission)
    let activeUsers = 8; // Default fallback
    try {
      const usersRes = await fetch(`${ckanUrl}/api/3/action/user_list`, {
        headers: {
          'Authorization': apiKey || '',
        },
      });
      const usersData = await usersRes.json();
      if (usersData.success) {
        activeUsers = usersData.result.length;
      }
    } catch (err) {
      console.log('Could not fetch users (may need admin permission)');
    }

    return NextResponse.json({
      totalDatasets,
      activeUsers,
      storageUsed: '2.4 GB', // Calculate from actual data later
      totalViews: 1234, // Get from analytics later
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
