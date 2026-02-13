import { Redirect } from 'expo-router';

export default function Index() {
  // In a real app, you'd check if user has seen onboarding
  // and if they're logged in, then redirect accordingly
  
  // For demo purposes, always start at onboarding
  // Change to /(auth)/login to skip onboarding
  // Change to /(tabs) to go straight to the app
  
  return <Redirect href="/(onboarding)" />;
}
