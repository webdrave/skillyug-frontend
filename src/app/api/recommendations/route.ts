import { NextRequest, NextResponse } from 'next/server'

interface RecommendationRequest {
  user_query: string
  ui_chips?: string[]
  max_results?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: RecommendationRequest = await request.json()
    
    // Validate request
    if (!body.user_query || typeof body.user_query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'user_query is required and must be a string' },
        { status: 400 }
      )
    }

    // Get recommendation engine URL from environment
    const recommendationEngineUrl = process.env.RECOMMENDATION_ENGINE_URL || 'http://localhost:8003'
    
    console.log(`[Recommendations API] Proxying request to: ${recommendationEngineUrl}`)
    console.log(`[Recommendations API] Query: "${body.user_query}"`)
    
    // Forward request to recommendation microservice
    const response = await fetch(`${recommendationEngineUrl}/api/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_query: body.user_query,
        ui_chips: body.ui_chips || [],
        max_results: body.max_results || 5
      })
    })

    if (!response.ok) {
      console.error(`[Recommendations API] Service error: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { 
          success: false, 
          error: `Recommendation service error: ${response.status} ${response.statusText}` 
        },
        { status: 502 }
      )
    }

    const data = await response.json()
    console.log(`[Recommendations API] Success: ${data.success ? 'true' : 'false'}`)
    
    if (data.success && data.data?.recommendations) {
      console.log(`[Recommendations API] Found ${data.data.recommendations.length} recommendations`)
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('[Recommendations API] Error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  try {
    const recommendationEngineUrl = process.env.RECOMMENDATION_ENGINE_URL || 'http://localhost:8003'
    
    const response = await fetch(`${recommendationEngineUrl}/health`, {
      method: 'GET',
    })

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Recommendation service unavailable: ${response.status}`,
          service_url: recommendationEngineUrl
        },
        { status: 503 }
      )
    }

    const healthData = await response.json()
    
    return NextResponse.json({
      success: true,
      message: 'Recommendation service is healthy',
      service_url: recommendationEngineUrl,
      service_health: healthData
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Service health check failed',
        service_url: process.env.RECOMMENDATION_ENGINE_URL || 'http://localhost:8003'
      },
      { status: 503 }
    )
  }
}