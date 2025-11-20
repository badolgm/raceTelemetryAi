import React from 'react';
import { I18nContext } from '../../services/i18n';

interface ErrorBoundaryProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static contextType = I18nContext;
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    // opcional: loguear a un servicio
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-4 bg-red-900/40 border border-red-700 rounded-md text-red-200">
          {(this.context as any)?.t ? (this.context as any).t('error.renderSectionError') : 'Se produjo un error al renderizar esta sección.'}
        </div>
      );
    }
    return this.props.children;
  }
}