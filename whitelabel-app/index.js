import { registerRootComponent } from 'expo';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Constants from 'expo-constants';

function App() {
  const clientConfig = Constants.expoConfig?.extra;
  const colors = clientConfig?.brandColors || {};

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.primary || '#1E3A8A' }]}>
        <Text style={styles.headerText}>White Label App</Text>
        <Text style={styles.subHeaderText}>{clientConfig?.appName || 'App'}</Text>
      </View>

      <View style={styles.content}>
        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          <InfoRow label="Client Name" value={clientConfig?.clientName || 'N/A'} />
          <InfoRow label="Version" value={clientConfig?.version || '1.0.0'} />
          <InfoRow label="Scheme" value={clientConfig?.scheme || 'N/A'} />
          <InfoRow label="Locale" value={clientConfig?.locale || 'en'} />
        </View>

        {/* Brand Colors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Brand Colors</Text>
          {Object.entries(colors).map(([key, value]) => (
            <View key={key} style={styles.colorRow}>
              <View style={[styles.colorBox, { backgroundColor: value }]} />
              <Text style={styles.colorLabel}>{key}:</Text>
              <Text style={styles.colorValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          {clientConfig?.features && Object.entries(clientConfig.features).map(([key, value]) => (
            <InfoRow 
              key={key} 
              label={key} 
              value={value ? 'Enabled' : 'Disabled'} 
            />
          ))}
        </View>

        {/* Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          <InfoRow label="API URL" value={clientConfig?.apiUrl || 'N/A'} />
          <InfoRow label="Support Email" value={clientConfig?.supportEmail || 'N/A'} />
        </View>

        {/* Validation Status */}
        <View style={[styles.section, styles.successSection]}>
          <Text style={styles.successTitle}>Validation Passed</Text>
          <Text style={styles.successText}>
            This configuration was validated using Zod schema validation.
            All required fields are present and properly formatted.
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
          <Text style={styles.instructionText}>• Test other clients: CLIENT=techstartup npm start</Text>
          <Text style={styles.instructionText}>• Create new client: npm run new-client myclient "My Company"</Text>
          <Text style={styles.instructionText}>• Validate config: npm run validate acme</Text>
          <Text style={styles.instructionText}>• Build for production: eas build --platform ios/android</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 40,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subHeaderText: {
    fontSize: 24,
    color: '#fff',
    opacity: 0.95,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  colorBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  colorLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    width: 100,
  },
  colorValue: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  successSection: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
    borderWidth: 2,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
});

registerRootComponent(App);
