import { NextResponse } from 'next/server';

// Mock student data - in production this would use Supabase/Prisma
let mockStudents = [
  {
    id: '1',
    email: 'student1@example.com',
    name: 'John Doe',
    role: 'student',
    paymentStatus: 'free',
    created_at: '2024-01-10T10:00:00Z',
    last_login: '2024-01-15T14:30:00Z',
    tests_completed: 5,
    avg_score: 78.5,
    payment_confirmed_at: null,
    payment_confirmed_by: null
  },
  {
    id: '2',
    email: 'student2@example.com',
    name: 'Jane Smith',
    role: 'student',
    paymentStatus: 'pro',
    created_at: '2024-01-12T09:15:00Z',
    last_login: '2024-01-15T16:45:00Z',
    tests_completed: 3,
    avg_score: 85.2,
    payment_confirmed_at: '2024-01-13T10:00:00Z',
    payment_confirmed_by: 'admin@example.com'
  },
  {
    id: '3',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    paymentStatus: 'free',
    created_at: '2024-01-01T08:00:00Z',
    last_login: '2024-01-15T18:00:00Z',
    tests_completed: 0,
    avg_score: 0,
    payment_confirmed_at: null,
    payment_confirmed_by: null
  },
  {
    id: '4',
    email: 'alice.johnson@example.com',
    name: 'Alice Johnson',
    role: 'student',
    paymentStatus: 'free',
    created_at: '2024-01-08T11:30:00Z',
    last_login: '2024-01-14T13:20:00Z',
    tests_completed: 8,
    avg_score: 92.3,
    payment_confirmed_at: null,
    payment_confirmed_by: null
  },
  {
    id: '5',
    email: 'bob.wilson@example.com',
    name: 'Bob Wilson',
    role: 'student',
    paymentStatus: 'pro',
    created_at: '2024-01-05T14:15:00Z',
    last_login: '2024-01-15T17:45:00Z',
    tests_completed: 12,
    avg_score: 88.7,
    payment_confirmed_at: '2024-01-06T09:30:00Z',
    payment_confirmed_by: 'admin@example.com'
  }
];

// GET - Fetch all students
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      students: mockStudents
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

// PUT - Update student (including payment status)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, role, paymentStatus, adminEmail } = body;

    const studentIndex = mockStudents.findIndex(student => student.id === id);
    
    if (studentIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      );
    }

    const updateData = {
      ...mockStudents[studentIndex],
      name: name || mockStudents[studentIndex].name,
      role: role || mockStudents[studentIndex].role
    };

    // Handle payment status change
    if (paymentStatus && paymentStatus !== mockStudents[studentIndex].paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      
      if (paymentStatus === 'pro') {
        updateData.payment_confirmed_at = new Date().toISOString();
        updateData.payment_confirmed_by = adminEmail || 'admin';
      } else if (paymentStatus === 'free') {
        updateData.payment_confirmed_at = null;
        updateData.payment_confirmed_by = null;
      }
    }

    mockStudents[studentIndex] = updateData;

    return NextResponse.json({
      success: true,
      student: mockStudents[studentIndex],
      message: 'Student updated successfully'
    });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update student' },
      { status: 500 }
    );
  }
}

// DELETE - Delete student
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Student ID is required' },
        { status: 400 }
      );
    }

    const studentIndex = mockStudents.findIndex(student => student.id === id);
    
    if (studentIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      );
    }

    mockStudents.splice(studentIndex, 1);

    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete student' },
      { status: 500 }
    );
  }
} 