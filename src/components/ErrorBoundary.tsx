// src/components/ErrorBoundary.tsx
import React from "react";

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { error };
  }
  componentDidCatch(error: any, info: any) {
    console.error("UI error:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="p-4">
          <div className="font-bold mb-2">Произошла ошибка интерфейса</div>
          <pre className="text-xs whitespace-pre-wrap">
            {String(this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
