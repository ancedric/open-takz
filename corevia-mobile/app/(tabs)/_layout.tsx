import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { Image, StyleSheet, Platform } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        // Couleurs des icônes
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#94a3b8',
        
        // Style de la barre
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        
        // Configuration du Header global pour éviter les répétitions
        headerTitle: '',
        headerLeft: () => (
          <Image 
            source={require('@/assets/images/logo-1.png')} 
            style={styles.headerLogo} 
            resizeMode="contain"
          />
        ),
        headerStyle: {
          backgroundColor: '#fff',
          elevation: 0, // Enlever la ligne sur Android
          shadowOpacity: 0, // Enlever la ligne sur iOS
        },
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="Portail"
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="briefcase" color={color} />,
        }}
      />

      <Tabs.Screen
        name="ManiAi"
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="bolt" color={color} />,
        }}
      />

      <Tabs.Screen
        name="Messenger"
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="wechat" color={color} />,
        }}
      />

      <Tabs.Screen
        name="Profil"
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#2a2f4f',
    borderRadius: 25,
    height: 65,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
    borderTopWidth: 0,
    // Ombre
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  tabBarItem: {
    height: 50,
  },
  headerLogo: {
    width: 120,
    height: 40,
    marginLeft: 20,
  }
});