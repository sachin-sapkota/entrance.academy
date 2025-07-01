import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const scenario = searchParams.get('scenario') || 'live';
    
    // Mock practice set data for different scenarios
    const mockPracticeSets = {
      'new_empty': {
        id: 'test-1',
        status: 'draft',
        is_live: false,
        title: 'Untitled Practice Set',
        questions: [],
        created_by: 'test-user'
      },
      'draft_with_content': {
        id: 'test-2', 
        status: 'draft',
        is_live: false,
        title: 'My Custom Practice Set',
        questions: [{ id: 1, text: 'Sample question' }],
        created_by: 'test-user'
      },
      'live_being_edited': {
        id: 'test-3',
        status: 'published', // or 'draft' during editing
        is_live: true,
        title: 'Live Practice Set',
        questions: [{ id: 1, text: 'Sample question' }],
        created_by: 'test-user'
      }
    };
    
    const practiceSet = mockPracticeSets[scenario];
    
    if (!practiceSet) {
      return NextResponse.json({
        error: 'Invalid scenario. Use: new_empty, draft_with_content, or live_being_edited'
      });
    }
    
    // Simulate the cleanup logic
    const isNewEmptyDraft = (
      practiceSet.status === 'draft' && 
      !practiceSet.is_live && 
      (!practiceSet.questions || practiceSet.questions.length === 0) &&
      (practiceSet.title === 'Untitled Practice Set' || !practiceSet.title?.trim())
    );
    
    let actionMessage = '';
    let actionTaken = '';
    
    if (isNewEmptyDraft) {
      actionTaken = 'DELETE';
      actionMessage = 'Empty draft deleted and editing session ended';
    } else {
      if (practiceSet.is_live) {
        actionTaken = 'CONVERT_TO_DRAFT';
        actionMessage = 'Live practice set converted to draft and editing session ended';
      } else {
        actionTaken = 'SAVE_DRAFT';
        actionMessage = 'Draft saved and editing session ended';
      }
    }
    
    return NextResponse.json({
      scenario,
      practiceSet,
      isNewEmptyDraft,
      actionTaken,
      actionMessage,
      explanation: `For scenario "${scenario}": ${actionMessage}`
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error.message
    });
  }
} 