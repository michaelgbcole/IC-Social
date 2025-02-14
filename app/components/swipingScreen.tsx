import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { COLORS } from '../theme';
import { getPotentialMatches, handleSwipe as handleSwipeApi } from '../../services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.6; // 60% of screen width

interface UserProfile {
    id: string;
    name: string;
    mainPicture: string;
    age: number;
    bio: string;
    gender: string;
    hasLikedMe: boolean;
    mutualLike: boolean;
}

export default function SwipingScreen({ userId }: { userId: string }) {
    function showMatchAnimation(currentProfile: UserProfile) {
        // For now, just show an alert. In a real app, you might want to:
        // 1. Show a modal with animation
        // 2. Play a sound
        // 3. Show confetti animation
        // 4. Display both users' photos
        alert(`Congratulations! You matched with ${currentProfile.name}! 🎉`);
    }
    
    const [noMoreUsers, setNoMoreUsers] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const position = useRef(new Animated.ValueXY()).current;
    const rotation = position.x.interpolate({
        inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        outputRange: ['-10deg', '0deg', '10deg'],
    });

    // Add swipe direction indicator
    const swipeDirection = useRef<'left' | 'right' | null>(null);
    const isActionInProgress = useRef(false);

    const forceSwipe = (direction: 'left' | 'right') => {
        if (isActionInProgress.current) return;
        isActionInProgress.current = true;
    
        const x = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
        
        Animated.sequence([
          // Quick initial rotation
          Animated.spring(position, {
            toValue: { 
              x: direction === 'right' ? 40 : -40,
              y: 0 
            },
            useNativeDriver: false,
            stiffness: 1000,
            damping: 15,
            mass: 0.5
          }),
          // Fast swipe off screen
          Animated.timing(position, {
            toValue: { x, y: 0 },
            duration: 100, // Even faster
            useNativeDriver: false,
          })
        ]).start(async () => {
          try {
            const currentProfile = users[currentIndex];
            if (!currentProfile) {
              setNoMoreUsers(true);
              return;
            }
    
            // Handle API call
            if (direction === 'right') {
              const result = await handleSwipeApi(userId, currentProfile.id, true);
              if (result.isMatch) {
                showMatchAnimation(currentProfile);
              }
            } else {
              await handleSwipeApi(userId, currentProfile.id, false);
            }
    
            // Reset position and update state
            position.setValue({ x: 0, y: 0 });
            
            if (currentIndex >= users.length - 1) {
              setNoMoreUsers(true);
            } else {
              setCurrentIndex(prev => prev + 1);
            }
    
            // Load more profiles if needed
            if (users.length - currentIndex <= 3) {
              loadUsers();
            }
          } catch (error) {
            console.error('Error in forceSwipe:', error);
          } finally {
            isActionInProgress.current = false;
          }
        });
      };

    const resetPosition = () => {
        if (isActionInProgress.current) return;
        
        Animated.spring(position, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 5,
          tension: 40,
        }).start();
      };

    const loadUsers = async () => {
        if (isLoading || !userId) return; // Add userId check
        
        setIsLoading(true);
        try {
            console.log('Loading users for userId:', userId); // Debug log
            const fetchedUsers = await getPotentialMatches(userId);
            
            if (!fetchedUsers) {
                console.error('No users returned from getPotentialMatches');
                setNoMoreUsers(true);
                return;
            }
            
            if (Array.isArray(fetchedUsers) && fetchedUsers.length === 0) {
                setNoMoreUsers(true);
                setUsers([]);
            } else {
                setUsers(prev => {
                    // Filter out any duplicates
                    const newUsers: UserProfile[] = fetchedUsers.filter(
                        (newUser: UserProfile) => !prev.some((existingUser: UserProfile) => existingUser.id === newUser.id)
                    );
                    return [...prev, ...newUsers];
                });
                setNoMoreUsers(false);
            }
        } catch (error) {
            console.error('Error loading users:', error);
            setNoMoreUsers(true);
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userId) { // Add userId check to useEffect
            loadUsers();
        }
    }, [userId]);

    useEffect(() => {
        // Check for mutual likes in current user
        const currentUser = users[currentIndex];
        if (currentUser?.mutualLike) {
            alert(`You matched with ${currentUser.name}!`);
        }
    }, [currentIndex, users]);

    const renderCard = (user: UserProfile, index: number) => {
        if (index !== currentIndex) return null;

        const cardStyle = {
            transform: [
                { translateX: position.x },
                { translateY: position.y },
            ],
        };

        return (
            <Animated.View style={[styles.card, cardStyle]}>
                <Animated.Image source={{ uri: user.mainPicture }} style={styles.cardImage} />
                <BlurView intensity={80} style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}, {user.age}</Text>
                    <Text style={styles.userBio}>{user.bio}</Text>
                </BlurView>
            </Animated.View>
        );
    };


    return (
        <Surface style={styles.container}>
            {users[currentIndex] ? (
                <>
                    {renderCard(users[currentIndex], currentIndex)}
                    <View style={styles.buttonContainer}>
                        <IconButton
                            icon="close"
                            mode="contained"
                            containerColor={COLORS.error}
                            iconColor="white"
                            size={30}
                            onPress={() => forceSwipe('left')}
                            style={styles.actionButton}
                        />
                        <IconButton
                            icon="heart"
                            mode="contained"
                            containerColor={COLORS.primary}
                            iconColor="white"
                            size={30}
                            onPress={() => forceSwipe('right')}
                            style={styles.actionButton}
                        />
                    </View>
                </>
            ) : (
                <View style={styles.emptyState}>
                    <Text variant="headlineMedium">No more profiles</Text>
                    <Text variant="bodyMedium">Check back later!</Text>
                </View>
            )}
        </Surface>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    card: {
        position: 'absolute',
        width: SCREEN_WIDTH - 32,
        height: SCREEN_WIDTH * 1.3,
        marginHorizontal: 16,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: COLORS.surface,
        elevation: 4,
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    userInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    userBio: {
        fontSize: 16,
        color: 'white',
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 32,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
    },
    actionButton: {
        elevation: 4,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    overlay: {
        position: 'absolute',
        top: 50,
        padding: 15,
        borderWidth: 3,
        borderRadius: 10,
        transform: [{ rotate: '30deg' }],
    },
    likeOverlay: {
        right: 20,
        borderColor: COLORS.primary,
    },
    nopeOverlay: {
        left: 20,
        borderColor: COLORS.error,
    },
    overlayText: {
        fontSize: 32,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});
