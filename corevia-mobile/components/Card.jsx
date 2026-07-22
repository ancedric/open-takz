import React from 'react';
import { Text, View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import DefaultCompany from '@/assets/images/company.png';

export default function Card({ post, onOpenDetails }) {
  return (
    <View style={styles.card}>
      {/* Header : Image + Titre + Entreprise */}
      <View style={styles.cardHeader}>
        <Image 
          source={post.logo_url ? { uri: post.logo_url } : DefaultCompany} 
          style={styles.logo} 
        />
        <View style={styles.headerText}>
          <Text style={styles.jobTitle} numberOfLines={1}>{post.title}</Text>
          <Text style={styles.companyName}>{post.company?.companyname}</Text>
        </View>
      </View>

      {/* Tags : Type et Lieu */}
      <View style={styles.tagContainer}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{post.type || 'recrutement'}</Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{post.location}</Text>
        </View>
      </View>

      {/* Description courte */}
      <View style={styles.content}>
        {post.file_url && (<Image
          source={{ uri: post.file_url }} 
          style={styles.image} 
        />)}
        <Text style={styles.description} numberOfLines={3}>
          {post.description}
        </Text>
      </View>

      {/* Footer : Date + Bouton Action */}
      <View style={styles.footer}>
        <Text style={styles.dateText}>Publié le {post.created_at.split('T')[0]}</Text>
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => onOpenDetails(post)}
        >
          <Text style={styles.actionBtnText}>Voir détails</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginVertical: 10,
    width: '90%',
    // Ombre pour iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // Ombre pour Android
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  jobTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#004581', // Bleu comme dans ton Home.vue
  },
  companyName: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#e2e8f0',
  },
  content: {
    marginBottom: 15,
  },
  description: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  actionBtn: {
    backgroundColor: '#2a2f4f',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});