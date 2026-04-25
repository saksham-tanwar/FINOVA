import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("UI error captured:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 px-4 py-16 text-white">
          <div className="mx-auto max-w-xl rounded-lg border border-slate-800 bg-slate-900 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-xl text-slate-400">
              !
            </div>
            <h1 className="mt-4 text-2xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-400">
              The app hit an unexpected error, but your session is still here. Refresh
              the page to continue.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
