'use client'

import { Phone, CheckCircle2, Calendar, ShoppingBag, Hash, Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

// TypeScript interfaces
interface Product {
  id: string
  name: string
  brand?: string
  serial_number?: string
  purchase_date?: string
  order_number?: string
  retailer?: string
  imageUrl?: string
  category?: string
}

interface CallAssistantProps {
  product: Product
  problemDescription: string
  supportPhoneNumber?: string
}

interface KeyInfoItem {
  label: string
  value: string | undefined
  icon: React.ComponentType<{ className?: string }>
  isRequired?: boolean
}

export default function CallAssistant({ 
  product, 
  problemDescription, 
  supportPhoneNumber = "1-800-BRAND-SUPPORT" 
}: CallAssistantProps) {
  
  // Format phone number for tel: link (remove non-numeric characters except +)
  const formatPhoneForTel = (phone: string) => {
    return phone.replace(/[^\d+]/g, '')
  }

  // Generate opening script based on product info
  const generateOpeningScript = () => {
    const productName = product.name
    const brandName = product.brand || "the manufacturer"
    
    return `Hello, I am calling to file a warranty claim for my ${productName}${product.brand ? ` from ${brandName}` : ''}. I have all my product information ready and would like to report an issue.`
  }

  // Key information items with icons
  const keyInfoItems: KeyInfoItem[] = [
    {
      label: "Serial Number",
      value: product.serial_number,
      icon: Hash,
      isRequired: true
    },
    {
      label: "Purchase Date",
      value: product.purchase_date,
      icon: Calendar,
      isRequired: true
    },
    {
      label: "Retailer",
      value: product.retailer,
      icon: Building2,
      isRequired: false
    },
    {
      label: "Order Number",
      value: product.order_number,
      icon: ShoppingBag,
      isRequired: false
    }
  ]

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-2">
          <Phone className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Your Call Assistant</h1>
        <p className="text-lg text-gray-600">Everything you need for your support call</p>
      </div>

      {/* Contact Information */}
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-center text-gray-900 flex items-center justify-center gap-2">
            <Phone className="w-6 h-6 text-blue-600" />
            Support Phone Number
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-gray-900 mb-4 tracking-wider">
              {supportPhoneNumber}
            </div>
            <Button
              size="lg"
              className="w-full max-w-xs mx-auto text-lg py-6"
              asChild
            >
              <a href={`tel:${formatPhoneForTel(supportPhoneNumber)}`}>
                <Phone className="w-5 h-5 mr-2" />
                Tap to Call
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Opening Script */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Opening Script
          </CardTitle>
          <p className="text-gray-600">Read this when the support agent answers</p>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-blue-500">
            <p className="text-lg leading-relaxed text-gray-900 font-medium">
              "{generateOpeningScript()}"
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Key Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Key Information
          </CardTitle>
          <p className="text-gray-600">Have this information ready when asked</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {keyInfoItems.map((item, index) => {
              const IconComponent = item.icon
              const hasValue = item.value && item.value.trim()
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <IconComponent className={`w-5 h-5 ${hasValue ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="font-semibold text-gray-900">{item.label}</span>
                    {item.isRequired && (
                      <Badge variant={hasValue ? "default" : "destructive"} className="text-xs">
                        {hasValue ? "Ready" : "Required"}
                      </Badge>
                    )}
                  </div>
                  <div className={`p-4 rounded-lg border-2 ${
                    hasValue 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    {hasValue ? (
                      <p className="text-lg font-mono text-gray-900 break-all">
                        {item.value}
                      </p>
                    ) : (
                      <p className="text-gray-500 italic">
                        {item.isRequired ? 'Required - Not Available' : 'Not Available'}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Problem Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Problem Summary
          </CardTitle>
          <p className="text-gray-600">Describe your issue exactly like this</p>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
            <p className="text-lg leading-relaxed text-gray-900 font-medium">
              "{problemDescription}"
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Product Context */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700">
            Product Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            {product.imageUrl && (
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-white shadow-sm flex-shrink-0">
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">
                {product.name}
              </h3>
              {product.brand && (
                <p className="text-gray-600 text-lg">{product.brand}</p>
              )}
              {product.category && (
                <Badge variant="outline" className="text-sm">
                  {product.category}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Tip */}
      <div className="text-center p-6 bg-blue-50 rounded-lg">
        <p className="text-gray-700 font-medium">
          💡 <strong>Tip:</strong> Stay calm and speak clearly. The support agent is there to help you!
        </p>
      </div>
    </div>
  )
}