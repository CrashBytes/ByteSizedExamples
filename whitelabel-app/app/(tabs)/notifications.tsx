import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card } from '../../components/Card';
import { useTheme } from '../../hooks/useTheme';

export default function NotificationsScreen() {
  const { colors } = useTheme();

  const notifications = [
    {
      id: '1',
      title: 'New message from John',
      message: 'Hey, I wanted to discuss the project...',
      time: '2 min ago',
      read: false,
      type: 'message',
    },
    {
      id: '2',
      title: 'Your order has shipped',
      message: 'Order #12345 is on its way',
      time: '1 hour ago',
      read: false,
      type: 'order',
    },
    {
      id: '3',
      title: 'Payment successful',
      message: 'Your payment of $99.99 was processed',
      time: '3 hours ago',
      read: true,
      type: 'payment',
    },
    {
      id: '4',
      title: 'New follower',
      message: 'Sarah started following you',
      time: '1 day ago',
      read: true,
      type: 'social',
    },
  ];

  const getIcon = (type: string) => {
    const icons: Record<string, string> = {
      message: '💬',
      order: '📦',
      payment: '💳',
      social: '👤',
    };
    return icons[type] || '🔔';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity>
          <Text style={[styles.markAllRead, { color: colors.primary }]}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      {notifications.map((notification) => (
        <TouchableOpacity key={notification.id} activeOpacity={0.7}>
          <Card style={[styles.notificationCard, !notification.read && styles.unread]}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{getIcon(notification.type)}</Text>
              {!notification.read && (
                <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
              )}
            </View>
            <View style={styles.content}>
              <Text style={styles.title}>{notification.title}</Text>
              <Text style={styles.message}>{notification.message}</Text>
              <Text style={styles.time}>{notification.time}</Text>
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  markAllRead: {
    fontSize: 14,
    fontWeight: '500',
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
  },
  unread: {
    backgroundColor: '#F0F9FF',
  },
  iconContainer: {
    marginRight: 12,
    position: 'relative',
  },
  icon: {
    fontSize: 32,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
});
