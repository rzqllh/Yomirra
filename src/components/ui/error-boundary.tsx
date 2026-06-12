"use client";

import React from "react";
import { Warning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      
      return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[300px] text-center bg-surface-base rounded-xl border border-border-subtle mx-4 my-8">
          <div className="bg-semantic-error/10 text-semantic-error p-4 rounded-full mb-4">
            <Warning weight="duotone" className="w-12 h-12" />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-2">Terjadi Kesalahan</h2>
          <p className="text-sm text-text-secondary mb-6 max-w-md">
            {this.state.error?.message || "Komponen ini gagal dimuat."}
          </p>
          <Button onClick={() => this.setState({ hasError: false })}>
            Coba Lagi
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
