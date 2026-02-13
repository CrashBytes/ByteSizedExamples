import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { useTheme } from '../../hooks/useTheme';

export default function SearchScreen() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: '1', name: 'Technology', count: 234, icon: '💻' },
    { id: '2', name: 'Business', count: 189, icon: '💼' },
    { id: '3', name: 'Design', count: 156, icon: '🎨' },
    { id: '4', name: 'Marketing', count: 142, icon: '📈' },
  ];

  const popularSearches = [
    'React Native',
    'White Label Apps',
    'Mobile Development',
    'UI Design',
    'App Marketing',
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.searchContainer}>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search..."
          style={styles.searchInput}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Categories</Text>
        {categories.map((category) => (
          <TouchableOpacity key={category.id} activeOpacity={0.7}>
            <Card style={styles.categoryCard}>
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryCount}>{category.count} items</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </Card>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Popular Searches</Text>
        <View style={styles.tagsContainer}>
          {popularSearches.map((search, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.tag, { borderColor: colors.primary }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.tagText, { color: colors.primary }]}>{search}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    marginBottom: 0,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
    color: '#333',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 14,
    color: '#666',
  },
  arrow: {
    fontSize: 24,
    color: '#999',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
