import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card } from '../../components/Card';
import { useTheme } from '../../hooks/useTheme';

export default function HomeScreen() {
  const { colors, config } = useTheme();

  const features = [
    { id: '1', title: 'Analytics', description: 'View your stats', icon: '📊' },
    { id: '2', title: 'Messages', description: '5 new messages', icon: '💬' },
    { id: '3', title: 'Tasks', description: '12 pending tasks', icon: '✓' },
    { id: '4', title: 'Calendar', description: '3 events today', icon: '📅' },
  ];

  const recentActivity = [
    { id: '1', title: 'New comment on your post', time: '2 minutes ago' },
    { id: '2', title: 'Your order has been shipped', time: '1 hour ago' },
    { id: '3', title: 'Payment received', time: '3 hours ago' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.greeting}>Welcome back!</Text>
        <Text style={styles.appName}>{config.appName}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          {features.map((feature) => (
            <TouchableOpacity key={feature.id} style={styles.gridItem} activeOpacity={0.7}>
              <Card style={styles.featureCard}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivity.map((activity) => (
          <Card key={activity.id} style={styles.activityCard}>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            <Text style={styles.activityTime}>{activity.time}</Text>
          </Card>
        ))}

        <Card style={[styles.statsCard, { borderLeftColor: colors.primary }]}>
          <Text style={styles.statsTitle}>This Week</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>1,234</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>89</Text>
              <Text style={styles.statLabel}>Conversions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.accent }]}>23</Text>
              <Text style={styles.statLabel}>New Users</Text>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 24,
    paddingTop: 40,
  },
  greeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  gridItem: {
    width: '48%',
  },
  featureCard: {
    alignItems: 'center',
    padding: 20,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  activityCard: {
    marginBottom: 12,
    padding: 16,
  },
  activityTitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  statsCard: {
    marginTop: 20,
    borderLeftWidth: 4,
    padding: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
});
