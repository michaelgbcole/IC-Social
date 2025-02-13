import SocketProvider from './app/contexts/SocketContext';
import Index from './app/index';

export default function App() {
  return (
    <SocketProvider>
      <Index />
    </SocketProvider>
  );
}
