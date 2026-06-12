'use client'

import { useState } from 'react'
import { ZoomButton } from '@/components/ui/zoom-button'
import { ZoomCard, ZoomCardContent, ZoomCardDescription, ZoomCardHeader, ZoomCardTitle } from '@/components/ui/zoom-card'
import { ZoomSkeleton } from '@/components/ui/zoom-skeleton'

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)

  const handleLoadingDemo = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 3000)
  }

  return (
    <main className="min-h-screen bg-background animate-fade-in">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
              Z
            </div>
            <h1 className="text-2xl font-bold text-foreground">Zoom Design System</h1>
          </div>
          <div className="text-sm text-muted-foreground">Light Theme • Professional UI</div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-slide-in-up">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
            Clean, Professional Design
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A comprehensive design system inspired by Zoom with subtle animations, smooth transitions, and accessibility-first components built with shadcn/ui and Tailwind CSS.
          </p>
        </div>
      </section>

      {/* Color Palette */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-2xl font-bold text-foreground mb-8">Color Palette</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <ZoomCard className="p-4">
            <div className="w-full h-24 rounded-lg bg-primary mb-4 zoom-shadow" />
            <p className="font-semibold text-foreground">Primary</p>
            <p className="text-sm text-muted-foreground">#0B63D4</p>
          </ZoomCard>
          <ZoomCard className="p-4">
            <div className="w-full h-24 rounded-lg bg-secondary mb-4 zoom-shadow" />
            <p className="font-semibold text-foreground">Secondary</p>
            <p className="text-sm text-muted-foreground">Light Gray</p>
          </ZoomCard>
          <ZoomCard className="p-4">
            <div className="w-full h-24 rounded-lg bg-background border border-border mb-4 zoom-shadow" />
            <p className="font-semibold text-foreground">Background</p>
            <p className="text-sm text-muted-foreground">White</p>
          </ZoomCard>
          <ZoomCard className="p-4">
            <div className="w-full h-24 rounded-lg bg-card border border-border mb-4 zoom-shadow" />
            <p className="font-semibold text-foreground">Card</p>
            <p className="text-sm text-muted-foreground">Off-white</p>
          </ZoomCard>
          <ZoomCard className="p-4">
            <div className="w-full h-24 rounded-lg bg-muted mb-4 zoom-shadow" />
            <p className="font-semibold text-foreground">Muted</p>
            <p className="text-sm text-muted-foreground">Light Gray</p>
          </ZoomCard>
        </div>
      </section>

      {/* Button Variants */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-2xl font-bold text-foreground mb-8">Button Variants</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ZoomCard>
            <ZoomCardHeader>
              <ZoomCardTitle>Default Button</ZoomCardTitle>
              <ZoomCardDescription>Primary action with shadow</ZoomCardDescription>
            </ZoomCardHeader>
            <ZoomCardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <ZoomButton variant="default">Default</ZoomButton>
                <ZoomButton variant="default" disabled>Disabled</ZoomButton>
                <ZoomButton variant="default" size="lg">Large</ZoomButton>
                <ZoomButton variant="default" size="sm">Small</ZoomButton>
              </div>
            </ZoomCardContent>
          </ZoomCard>

          <ZoomCard>
            <ZoomCardHeader>
              <ZoomCardTitle>Secondary Button</ZoomCardTitle>
              <ZoomCardDescription>Secondary actions</ZoomCardDescription>
            </ZoomCardHeader>
            <ZoomCardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <ZoomButton variant="secondary">Secondary</ZoomButton>
                <ZoomButton variant="secondary" disabled>Disabled</ZoomButton>
                <ZoomButton variant="secondary" size="lg">Large</ZoomButton>
                <ZoomButton variant="secondary" size="sm">Small</ZoomButton>
              </div>
            </ZoomCardContent>
          </ZoomCard>

          <ZoomCard>
            <ZoomCardHeader>
              <ZoomCardTitle>Outline Button</ZoomCardTitle>
              <ZoomCardDescription>Subtle, bordered buttons</ZoomCardDescription>
            </ZoomCardHeader>
            <ZoomCardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <ZoomButton variant="outline">Outline</ZoomButton>
                <ZoomButton variant="outline" disabled>Disabled</ZoomButton>
                <ZoomButton variant="outline" size="lg">Large</ZoomButton>
                <ZoomButton variant="outline" size="sm">Small</ZoomButton>
              </div>
            </ZoomCardContent>
          </ZoomCard>

          <ZoomCard>
            <ZoomCardHeader>
              <ZoomCardTitle>Ghost Button</ZoomCardTitle>
              <ZoomCardDescription>Minimal, text-based</ZoomCardDescription>
            </ZoomCardHeader>
            <ZoomCardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <ZoomButton variant="ghost">Ghost</ZoomButton>
                <ZoomButton variant="ghost" disabled>Disabled</ZoomButton>
                <ZoomButton variant="ghost" size="lg">Large</ZoomButton>
                <ZoomButton variant="ghost" size="sm">Small</ZoomButton>
              </div>
            </ZoomCardContent>
          </ZoomCard>

          <ZoomCard className="md:col-span-2">
            <ZoomCardHeader>
              <ZoomCardTitle>Destructive Button</ZoomCardTitle>
              <ZoomCardDescription>For dangerous actions</ZoomCardDescription>
            </ZoomCardHeader>
            <ZoomCardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <ZoomButton variant="destructive">Delete</ZoomButton>
                <ZoomButton variant="destructive" disabled>Disabled</ZoomButton>
                <ZoomButton variant="destructive" size="lg">Large</ZoomButton>
                <ZoomButton variant="destructive" size="sm">Small</ZoomButton>
              </div>
            </ZoomCardContent>
          </ZoomCard>
        </div>
      </section>

      {/* Cards Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-2xl font-bold text-foreground mb-8">Card Component</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ZoomCard>
            <ZoomCardHeader>
              <ZoomCardTitle>Card Title</ZoomCardTitle>
              <ZoomCardDescription>This is a card component with smooth shadows</ZoomCardDescription>
            </ZoomCardHeader>
            <ZoomCardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Cards have subtle shadows and smooth hover effects. Perfect for organizing content into distinct sections.
              </p>
              <ZoomButton variant="outline" size="sm">Learn More</ZoomButton>
            </ZoomCardContent>
          </ZoomCard>

          <ZoomCard>
            <ZoomCardHeader>
              <ZoomCardTitle>Interactive Demo</ZoomCardTitle>
              <ZoomCardDescription>Click to see loading animation</ZoomCardDescription>
            </ZoomCardHeader>
            <ZoomCardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Demonstrating shimmer loading states and smooth transitions.
              </p>
              <ZoomButton onClick={handleLoadingDemo} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Start Demo'}
              </ZoomButton>
            </ZoomCardContent>
          </ZoomCard>

          <ZoomCard>
            <ZoomCardHeader>
              <ZoomCardTitle>Meeting Room</ZoomCardTitle>
              <ZoomCardDescription>Video tile example</ZoomCardDescription>
            </ZoomCardHeader>
            <ZoomCardContent>
              <div className="video-tile-placeholder h-40 mb-4 flex flex-col items-center justify-center gap-2">
                <div className="text-gray-400 text-4xl">📹</div>
                <span className="text-gray-400 text-sm">Video Placeholder</span>
              </div>
              <ZoomButton variant="outline" size="sm" className="w-full">Join Meeting</ZoomButton>
            </ZoomCardContent>
          </ZoomCard>
        </div>
      </section>

      {/* Loading States */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-2xl font-bold text-foreground mb-8">Loading States (Shimmer)</h3>
        <ZoomCard>
          <ZoomCardHeader>
            <ZoomCardTitle>Shimmer Skeleton Loaders</ZoomCardTitle>
            <ZoomCardDescription>Smooth, animated loading placeholders</ZoomCardDescription>
          </ZoomCardHeader>
          <ZoomCardContent>
            {isLoading ? (
              <div className="space-y-4">
                <ZoomSkeleton className="h-12 w-3/4" />
                <ZoomSkeleton className="h-8 w-1/2" />
                <div className="grid grid-cols-3 gap-4">
                  <ZoomSkeleton className="h-20" />
                  <ZoomSkeleton className="h-20" />
                  <ZoomSkeleton className="h-20" />
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-muted-foreground">
                <p>Click the button in the interactive demo card to see loading states with shimmer animation.</p>
              </div>
            )}
          </ZoomCardContent>
        </ZoomCard>
      </section>

      {/* Typography */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-2xl font-bold text-foreground mb-8">Typography</h3>
        <ZoomCard>
          <ZoomCardContent className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Heading 1 (4xl)</h1>
              <p className="text-muted-foreground">Large, bold headlines for main content</p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Heading 2 (3xl)</h2>
              <p className="text-muted-foreground">Section titles and major content divisions</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Heading 3 (2xl)</h3>
              <p className="text-muted-foreground">Subsection titles and card headers</p>
            </div>
            <div>
              <p className="text-base text-foreground mb-2">Body text (base)</p>
              <p className="text-muted-foreground">Regular paragraph text for main content, optimized for readability</p>
            </div>
            <div>
              <p className="text-sm text-foreground mb-2">Small text (sm)</p>
              <p className="text-muted-foreground">Smaller text for secondary information and descriptions</p>
            </div>
          </ZoomCardContent>
        </ZoomCard>
      </section>

      {/* Animation Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-2xl font-bold text-foreground mb-8">Animations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ZoomCard className="animate-slide-in-up" style={{ animationDelay: '0s' }}>
            <ZoomCardHeader>
              <ZoomCardTitle>Slide In Up</ZoomCardTitle>
            </ZoomCardHeader>
            <ZoomCardContent>
              <p className="text-sm text-muted-foreground">Smooth entrance from bottom with fade</p>
            </ZoomCardContent>
          </ZoomCard>

          <ZoomCard className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <ZoomCardHeader>
              <ZoomCardTitle>Fade In</ZoomCardTitle>
            </ZoomCardHeader>
            <ZoomCardContent>
              <p className="text-sm text-muted-foreground">Simple opacity transition effect</p>
            </ZoomCardContent>
          </ZoomCard>

          <ZoomCard className="animate-pulse-soft">
            <ZoomCardHeader>
              <ZoomCardTitle>Pulse Soft</ZoomCardTitle>
            </ZoomCardHeader>
            <ZoomCardContent>
              <p className="text-sm text-muted-foreground">Gentle pulsing opacity animation</p>
            </ZoomCardContent>
          </ZoomCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-border mt-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h4 className="font-semibold text-foreground mb-3">Design System</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition">Colors</a></li>
              <li><a href="#" className="hover:text-primary transition">Typography</a></li>
              <li><a href="#" className="hover:text-primary transition">Components</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition">Documentation</a></li>
              <li><a href="#" className="hover:text-primary transition">Guidelines</a></li>
              <li><a href="#" className="hover:text-primary transition">Examples</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3">Built With</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Next.js 16</li>
              <li>Tailwind CSS v4</li>
              <li>shadcn/ui</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>Zoom Design System • Professional, accessible, and beautiful UI components</p>
        </div>
      </footer>
    </main>
  )
}
