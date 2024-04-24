import 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ApplicationNavigator from './navigators/Application';

const queryClient = new QueryClient();

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<ApplicationNavigator />
		</QueryClientProvider>
	);
}

export default App;
