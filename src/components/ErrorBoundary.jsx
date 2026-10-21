import { Component } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

// Catches render errors so one broken page shows a message instead of a blank screen
export default class ErrorBoundary extends Component {
  state = { error: null, resetKey: this.props.resetKey }

  static getDerivedStateFromError(error) {
    return { error }
  }

  // Navigating to another page (new resetKey) clears the error
  static getDerivedStateFromProps(props, state) {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </span>
        <h1 className="text-xl font-semibold">Something went wrong on this page</h1>
        <p className="break-all font-mono text-xs text-muted-foreground">{String(this.state.error?.message ?? this.state.error)}</p>
        <Button variant="outline" onClick={() => this.setState({ error: null })}>Try again</Button>
      </div>
    )
  }
}
