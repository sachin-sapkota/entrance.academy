import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Fetch all domains
export async function GET() {
  try {
    const { data: domains, error } = await supabase
      .from('domains')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch domains' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      domains: domains || []
    })
  } catch (error) {
    console.error('Error fetching domains:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch domains' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const data = await request.json()
    
    const domain = await prisma.domain.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        iconUrl: data.iconUrl,
        colorCode: data.colorCode || '#3B82F6',
        negativeMarkingRatio: data.negativeMarkingRatio || 0.25,
        passingPercentage: data.passingPercentage || 0.40
      },
      include: {
        questionCategories: true,
        _count: {
          select: {
            questions: true
          }
        }
      }
    })

    return NextResponse.json({ domain }, { status: 201 })
  } catch (error) {
    console.error('Error creating domain:', error)
    return NextResponse.json(
      { error: 'Failed to create domain' },
      { status: 500 }
    )
  }
} 