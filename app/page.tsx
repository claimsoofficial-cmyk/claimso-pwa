'use client'
export const dynamic = 'force-dynamic'; // ADD THIS LINE
import { useState } from 'react'
import { Shield, Zap, CheckCircle, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import ConnectionModal from '@/components/shared/ConnectionModal'

// Feature card component
function FeatureCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: typeof Shield; 
  title: string; 
  description: string; 
}) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
        <Icon className="w-7 h-7 text-blue-600" />
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-3">
        {title}
      </h3>
      
      <p className="text-gray-600 leading-relaxed">
        {description}
      </p>
    </div>
  )
}

export default function MarketingHomepage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleCTAClick = () => {
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" />
          <div className="absolute top-0 right-1/3 transform translate-x-1/2 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
          {/* Navigation */}
          <nav className="flex justify-between items-center mb-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Claimso</span>
            </div>
            
            <button
              onClick={handleCTAClick}
              className="bg-white text-blue-600 font-semibold px-4 py-2 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              Sign In
            </button>
          </nav>

          {/* Hero Content */}
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Your Smart Vault for{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Everything You Buy
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              Never lose a receipt, warranty, or purchase again. Claimso automatically captures, 
              organizes, and protects every purchase you make.
            </p>
            
            <button
              onClick={handleCTAClick}
              className={cn(
                "group inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700", 
                "text-white font-semibold text-lg px-8 py-4 rounded-xl",
                "shadow-lg hover:shadow-xl transition-all duration-300",
                "transform hover:-translate-y-1"
              )}
            >
              Sync My Purchases & Start for Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <p className="text-sm text-gray-500 mt-4">
              ✨ No credit card required • Works with Amazon, email receipts & more
            </p>
          </div>

          {/* Hero Visual (placeholder for product screenshot/demo) */}
          <div className="mt-16 relative">
            <div className="mx-auto max-w-4xl">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 backdrop-blur-sm bg-white/90">
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium">
                      Product Demo Preview
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      Dashboard screenshot coming soon
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to stay organized
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From automatic capture to smart resolutions, Claimso handles the tedious work 
              so you can focus on what matters.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <FeatureCard
              icon={Zap}
              title="Automated Capture"
              description="Connect your email and shopping accounts. Claimso automatically finds and organizes every purchase, receipt, and warranty without any manual work."
            />
            
            <FeatureCard
              icon={Shield}
              title="Warranty Clarity"
              description="Never wonder if something is still under warranty. Get instant visibility into protection status, expiration dates, and coverage details for every item."
            />
            
            <FeatureCard
              icon={CheckCircle}
              title="Smart Resolutions"
              description="When things break or go wrong, Claimso guides you through returns, repairs, and warranty claims with step-by-step assistance and automated filing."
            />
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to take control of your purchases?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who never lose track of their stuff again.
          </p>
          
          <button
            onClick={handleCTAClick}
            className={cn(
              "group inline-flex items-center gap-3 bg-white hover:bg-gray-50",
              "text-blue-600 font-semibold text-lg px-8 py-4 rounded-xl",
              "shadow-lg hover:shadow-xl transition-all duration-300",
              "transform hover:-translate-y-1"
            )}
          >
            Get Started Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Claimso</span>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-sm">
                © 2025 Claimso. All rights reserved.
              </p>
              <p className="text-sm mt-1">
                Your smart purchase management platform.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Connection Modal */}
      <ConnectionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  )
}