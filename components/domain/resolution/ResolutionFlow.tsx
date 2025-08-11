'use client'
import Image from 'next/image'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Wrench, 
  AlertTriangle, 
  MonitorSpeaker, 
  HelpCircle,
  ArrowRight 
} from 'lucide-react'

// TypeScript interfaces
interface Product {
  id: string
  name: string
  imageUrl?: string
  brand?: string
  category?: string
}

interface ResolutionFlowProps {
  product: Product
  onComplete?: (issueType: IssueType, description: string) => void
  onCancel?: () => void
}

type FlowStep = 'select_issue_type' | 'describe_problem'

type IssueType = 'hardware_malfunction' | 'physical_damage' | 'software_issue' | 'other'

interface IssueTypeOption {
  type: IssueType
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

export default function ResolutionFlow({ product, onComplete, onCancel }: ResolutionFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('select_issue_type')
  const [selectedIssueType, setSelectedIssueType] = useState<IssueType | null>(null)
  const [problemDescription, setProblemDescription] = useState('')

  // Issue type options with icons and descriptions
  const issueTypeOptions: IssueTypeOption[] = [
    {
      type: 'hardware_malfunction',
      label: 'Hardware Malfunction',
      description: 'Device not working as expected',
      icon: Wrench,
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-800'
    },
    {
      type: 'physical_damage',
      label: 'Physical Damage',
      description: 'Cracks, dents, or visible damage',
      icon: AlertTriangle,
      color: 'bg-red-50 hover:bg-red-100 border-red-200 text-red-800'
    },
    {
      type: 'software_issue',
      label: 'Software Issue',
      description: 'App crashes, freezing, or updates',
      icon: MonitorSpeaker,
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800'
    },
    {
      type: 'other',
      label: 'Other',
      description: 'Something else not listed above',
      icon: HelpCircle,
      color: 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800'
    }
  ]

  // Handle issue type selection
  const handleIssueTypeSelect = (issueType: IssueType) => {
    setSelectedIssueType(issueType)
    setCurrentStep('describe_problem')
  }

  // Handle continue from description step
  const handleContinue = () => {
    if (selectedIssueType && problemDescription.trim()) {
      onComplete?.(selectedIssueType, problemDescription.trim())
    }
  }

  // Handle back navigation
  const handleBack = () => {
    if (currentStep === 'describe_problem') {
      setCurrentStep('select_issue_type')
      setProblemDescription('')
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Product Context Header */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        {product.imageUrl ? (
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-white shadow-sm flex-shrink-0">
            <Image src={product.imageUrl} alt={product.name} width={200} height={150}/>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
            <MonitorSpeaker className="w-8 h-8 text-gray-400" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
          {product.brand && (
            <p className="text-sm text-gray-600">{product.brand}</p>
          )}
          {product.category && (
            <Badge variant="secondary" className="mt-1">
              {product.category}
            </Badge>
          )}
        </div>
      </div>

      {/* Step 1: Issue Type Selection */}
      {currentStep === 'select_issue_type' && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">
              What kind of issue are you having?
            </h2>
            <p className="text-gray-600">
              Select the option that best describes your problem
            </p>
          </div>

          <div className="grid gap-3">
            {issueTypeOptions.map((option) => {
              const IconComponent = option.icon
              return (
                <Button
                  key={option.type}
                  variant="outline"
                  size="lg"
                  onClick={() => handleIssueTypeSelect(option.type)}
                  className={`h-auto p-4 justify-start text-left transition-all duration-200 ${option.color}`}
                >
                  <div className="flex items-center gap-4 w-full">
                    <IconComponent className="w-6 h-6 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm opacity-80 mt-1">
                        {option.description}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 flex-shrink-0 opacity-60" />
                  </div>
                </Button>
              )
            })}
          </div>

          {/* Cancel Button */}
          {onCancel && (
            <div className="flex justify-center pt-4">
              <Button 
                variant="ghost" 
                onClick={onCancel}
                className="text-gray-600 hover:text-gray-800"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Problem Description */}
      {currentStep === 'describe_problem' && selectedIssueType && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">
              Tell us more about the problem
            </h2>
            <p className="text-gray-600">
              Please describe the issue in one clear sentence
            </p>
            
            {/* Show selected issue type */}
            <div className="inline-flex items-center gap-2 mt-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-800">
                {issueTypeOptions.find(opt => opt.type === selectedIssueType)?.label}
              </Badge>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <label 
                  htmlFor="problem-description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Problem Description
                </label>
                <Textarea
                  id="problem-description"
                  placeholder="For example: The screen is flickering when I turn it on..."
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  className="min-h-[100px] resize-none"
                  maxLength={500}
                />
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Be as specific as possible</span>
                  <span>{problemDescription.length}/500</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-between">
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="flex-1"
            >
              Back
            </Button>
            <Button 
              onClick={handleContinue}
              disabled={!problemDescription.trim()}
              className="flex-1"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Cancel Option */}
          {onCancel && (
            <div className="flex justify-center">
              <Button 
                variant="ghost" 
                onClick={onCancel}
                className="text-gray-600 hover:text-gray-800"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}