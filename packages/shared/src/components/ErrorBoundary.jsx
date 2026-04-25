import React from 'react';
import { Card, Button } from './index.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Frontend Error Captured:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6" dir="rtl">
          <Card className="max-w-md w-full text-center">
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-2xl font-black text-stone-900 mb-4">عذراً، حدث خطأ غير متوقع</h2>
            <p className="text-stone-500 font-bold mb-8">
              لقد واجه النظام مشكلة تقنية. يرجى محاولة إعادة تحميل الصفحة.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="btn-block"
            >
              إعادة تحميل الصفحة
            </Button>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-8 p-4 bg-stone-100 rounded-xl text-[10px] text-left overflow-auto max-h-40">
                {this.state.error?.toString()}
              </pre>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
