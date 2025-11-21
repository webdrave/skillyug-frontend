'use client'

import { useState, FormEvent } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Star, TrendingUp, Zap, DollarSign } from 'lucide-react';
import { getRecommendations, type RecommendationResponse as RecResponse, type Recommendation } from '../../services/recommendationService'

const UI_CHIPS = [
  'certification', 'affordable', 'beginner', 'intermediate', 'advanced',
  'bootcamp', 'refund', 'tokens', 'python', 'javascript', 'web development',
  'data science', 'machine learning'
]

export default function DemoRecommendations() {
  const [query, setQuery] = useState('')
  const [selectedChips, setSelectedChips] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<RecResponse | null>(null)

  const toggleChip = (chip: string) => {
    setSelectedChips(prev => 
      prev.includes(chip) 
        ? prev.filter(c => c !== chip)
        : [...prev, chip]
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await getRecommendations(query, selectedChips)
      setRecommendations(data)
    } catch (err) {
      console.error('Failed to fetch recommendations:', err)
      setError('Failed to fetch recommendations. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getMatchTypeIcon = (type: string) => {
    switch (type) {
      case 'exact': return <Star className="h-4 w-4 text-green-500" />
      case 'similar': return <TrendingUp className="h-4 w-4 text-blue-500" />
      case 'fallback': return <Zap className="h-4 w-4 text-orange-500" />
      default: return <Search className="h-4 w-4 text-gray-500" />
    }
  }

  const getMatchTypeColor = (type: string) => {
    switch (type) {
      case 'exact': return 'bg-green-100 text-green-800'
      case 'similar': return 'bg-blue-100 text-blue-800'
      case 'fallback': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Course Recommendation Engine</h1>
        <p className="text-muted-foreground text-lg">
          Test our AI-powered course recommendations with natural language queries
        </p>
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Input Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search for Courses
          </CardTitle>
          <CardDescription>
            Describe what course you&apos;re looking for in natural language
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="query">Your Query</Label>
            <Input
              id="query"
              placeholder="e.g., I want to learn Python for beginners under 1500 rupees with certification"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSubmit(e)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>UI Chips (Optional)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {UI_CHIPS.map((chip) => (
                <Badge
                  key={chip}
                  variant={selectedChips.includes(chip) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => toggleChip(chip)}
                >
                  {chip}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || !query.trim()}
              className="mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Get Recommendations
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {recommendations && (
        <div className="space-y-6">
          {/* Intent Parsing Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Parsed Intent
              </CardTitle>
              <CardDescription>How our AI understood your query</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Intent</Label>
                  <p className="text-sm text-muted-foreground">{recommendations.intent.intent}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Keywords</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {recommendations.intent.keywords.map((keyword: string) => (
                      <Badge key={keyword} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
                {recommendations.intent.level && (
                  <div>
                    <Label className="text-sm font-medium">Level</Label>
                    <p className="text-sm text-muted-foreground">{recommendations.intent.level}</p>
                  </div>
                )}
                {recommendations.intent.price_range && (
                  <div>
                    <Label className="text-sm font-medium">Price Range</Label>
                    <p className="text-sm text-muted-foreground">
                      {recommendations.intent.price_range.min && `Min: ₹${recommendations.intent.price_range.min}`}
                      {recommendations.intent.price_range.max && `Max: ₹${recommendations.intent.price_range.max}`}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">
                Recommendations ({recommendations.total_results})
              </h2>
              <p className="text-muted-foreground">{recommendations.message}</p>
            </div>

            <div className="grid gap-4">
              {recommendations.recommendations.map((rec: Recommendation) => (
                <Card key={rec.course.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {rec.course.title}
                          <Badge className={getMatchTypeColor(rec.match_type)}>
                            {getMatchTypeIcon(rec.match_type)}
                            {rec.match_type}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            ₹{rec.course.price}
                          </span>
                          <Badge variant="outline">{rec.course.level}</Badge>
                          <span className="text-sm">
                            {Math.round(rec.confidence_score * 100)}% match
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {rec.course.description && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {rec.course.description}
                        </p>
                      </div>
                    )}

                    <div>
                      <Label className="text-sm font-medium">Features</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rec.course.features.map((feature: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="bg-muted/50 p-3 rounded-lg">
                      <Label className="text-sm font-medium">Why this recommendation?</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rec.reasoning}
                      </p>
                    </div>

                    {(rec.course.refund_policy || rec.course.tokens || rec.course.certificate) && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        {rec.course.certificate && (
                          <Badge variant="secondary">🏆 Certificate</Badge>
                        )}
                        {rec.course.tokens && (
                          <Badge variant="secondary">🎟️ {rec.course.tokens} tokens</Badge>
                        )}
                        {rec.course.refund_policy && (
                          <Badge variant="secondary">💰 {rec.course.refund_policy}</Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Example Queries */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Example Queries to Try</CardTitle>
          <CardDescription>Click on any example to test it</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              'I want to learn Python for beginners',
              'Show me affordable programming courses under 1500',
              'Python course with certification and refund policy',
              'Intermediate level programming bootcamp',
              'Course for beginners with missed class buyback',
              'Python Bounder course with certificate'
            ].map((example) => (
              <Button
                key={example}
                variant="outline"
                className="text-left justify-start h-auto p-3"
                onClick={() => setQuery(example)}
              >
                <div className="text-sm">{example}</div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}