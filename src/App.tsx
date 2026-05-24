import Shop from './app/shop/page';
import ErrorBoundary from './components/ui/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <Shop />
    </ErrorBoundary>
  );
}
