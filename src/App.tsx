import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const steps = [
  {
    number: '1',
    title: 'Define your scope',
    description: (
      <>
        Edit{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          docs/outline.md
        </code>{' '}
        with your goal, flows, and data model.
      </>
    ),
  },
  {
    number: '2',
    title: 'Plan your slices',
    description: (
      <>
        Break work into phases in{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          docs/plan.md
        </code>
        .
      </>
    ),
  },
  {
    number: '3',
    title: 'Add visual references',
    description: (
      <>
        Drop screenshots and moodboard images into{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          docs/screenshots/
        </code>{' '}
        and{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          docs/moodboard/
        </code>
        .
      </>
    ),
  },
  {
    number: '4',
    title: 'Start building',
    description:
      'Ask your AI agent to read the outline and propose the first task.',
  },
]

function App() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden px-4">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-primary)/4%,transparent_50%),radial-gradient(ellipse_at_bottom_right,var(--color-chart-1)/6%,transparent_50%)]" />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-10 py-16">
        {/* Hero */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="bg-primary/10 text-primary mb-2 inline-flex rounded-full px-3 py-1 text-xs font-medium tracking-wide uppercase">
            Vibecoding Template
          </div>
          <h1 className="animate-gradient bg-gradient-to-r from-foreground via-primary to-foreground bg-[length:200%_auto] bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            Ready to build
          </h1>
          <p className="text-muted-foreground max-w-md text-base leading-relaxed">
            A guardrailed starter for AI-assisted React development. Define your
            scope, plan your slices, and let the agent build incrementally.
          </p>
        </div>

        {/* Getting started card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg">Get started</CardTitle>
            <CardDescription>
              Four steps to go from template to working app.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-4">
                <div className="bg-primary text-primary-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  {step.number}
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium leading-none">
                    {step.title}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-muted-foreground/60 text-xs">
          React + Vite + TypeScript + Tailwind + shadcn/ui
        </p>
      </div>
    </div>
  )
}

export default App
