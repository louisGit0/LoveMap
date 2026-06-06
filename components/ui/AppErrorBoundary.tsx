import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Garde-fou global contre les erreurs de rendu au lancement.
 *
 * Volontairement autonome : couleurs et police codées en dur (pas de
 * `useTheme`, pas de police custom). Si le système de thème ou le chargement
 * des polices est précisément ce qui a planté, le fallback doit rester
 * affichable sans dépendre de cette même chaîne. Cf. motif de refus Apple
 * « App unresponsive on launch » (Guideline 2.1a).
 */
class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[AppErrorBoundary] Erreur capturée au rendu :', error.message, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Une erreur est survenue</Text>
          <Text style={styles.message}>
            {this.state.error?.message ?? 'Erreur inconnue au lancement.'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleRetry} accessibilityRole="button">
            <Text style={styles.buttonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    color: '#8a8a8a',
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#ff2d87',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppErrorBoundary;
