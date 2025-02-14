import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, PanResponder } from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { getPotentialMatches, handleSwipe as handleSwipeApi } from '../../services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.6; // 60% of screen width
const AUTO_SWIPE_THRESHOLD = SCREEN_WIDTH * 0.15; // 15% of screen width for auto-swipe

// Example updated color palette - adjust to your liking in theme.js or directly here
const COLORS = {
    primary: '#e91e63', // Pink/Magenta - Heart button color
    secondary: '#673ab7', // Deep Purple
    accent: '#03dac5', // Teal/Cyan
    background: '#f8f8f8', // Light gray background
    surface: '#ffffff', // White card surface
    error: '#f44336', // Red - Nope button color
    textPrimary: '#212121', // Dark gray text
    textSecondary: '#757575', // Medium gray text
    // ... other colors if you have them
};


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
    const [isCardVisible, setIsCardVisible] = useState(true);
    const nextCardReady = useRef(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const currentIndexAnim = useRef(new Animated.Value(0)).current; // Animated value for currentIndex
    const isSwipeTriggered = useRef(false);

    useEffect(() => {
        currentIndexAnim.setValue(currentIndex); // Sync currentIndex with animated value
    }, [currentIndex]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                position.setValue({ x: gestureState.dx, y: gestureState.dy });
            },
            onPanResponderRelease: (_, gestureState) => {
                // If card has moved at all, determine direction and swipe
                if (gestureState.dx !== 0) {
                    console.log(gestureState.dx, "hi");
                    const direction = gestureState.dx > 0 ? 'right' : 'left';
                    console.log('Direction:', direction);
                    forceSwipe(direction);
                } else {
                    resetPosition();
                }
            },
            onPanResponderTerminate: () => {
                resetPosition();
            },
        })
    ).current;

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <View style={styles.emptyStateTextContainer}>
                <Text variant="headlineMedium" style={styles.emptyStateHeadline}>No more profiles</Text>
                <Text variant="bodyMedium" style={styles.emptyStateBody}>Check back later!</Text>
            </View>
        </View>
    );

    const forceSwipe = (direction: 'left' | 'right') => {
        if (isActionInProgress.current) return;
        isActionInProgress.current = true;
        console.log('Forcing swipe:', direction);
        const x = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;

        Animated.timing(position, {
            toValue: { x, y: 0 },
            duration: 250,
            useNativeDriver: false,
        }).start(async () => {
            try {
                const currentProfile = users[currentIndex];
                if (!currentProfile) return;

                // Handle the API call
                if (direction === 'right') {
                    console.log('Swiped right on:', currentProfile.name);
                    const result = await handleSwipeApi(userId, currentProfile.id, true);
                    if (result.isMatch) {
                        showMatchAnimation(currentProfile);
                    }
                } else {
                    await handleSwipeApi(userId, currentProfile.id, false);
                }

                // Important: Update the index first
                setCurrentIndex(prevIndex => prevIndex + 1);

                // Then reset the position
                position.setValue({ x: 0, y: 0 });

                // Check if we need to load more users
                if (users.length - currentIndex <= 3) {
                    loadUsers();
                }

                // Check if we're out of users
                if (currentIndex >= users.length - 1) {
                    setNoMoreUsers(true);
                }

            } catch (error) {
                console.error('Error in forceSwipe:', error);
                // Reset position even if there's an error
                position.setValue({ x: 0, y: 0 });
            } finally {
                isActionInProgress.current = false;
            }
        });
    };

    const resetPosition = () => {
        if (isActionInProgress.current) return;

        Animated.timing(position, {
            toValue: { x: 0, y: 0 },
            duration: 200,
            useNativeDriver: false,
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
        const cardStyle: Animated.WithAnimatedValue<any> = {
            transform: [
                { translateX: position.x },
                { translateY: position.y },
                { rotate: rotation } // Rotation now applied here
            ],
            zIndex: users.length - index,
        };

        const isCurrentCard = index === currentIndex;
        const isNextCard = index === currentIndex + 1;

        let animatedStyle = cardStyle;

        if (!isCurrentCard && !isNextCard) {
            animatedStyle = { ...cardStyle, opacity: 0 };
        } else if (isNextCard) {
            animatedStyle = { ...cardStyle, translateY: 10, scale: 0.95 };
        }

        return (
            <Animated.View
                key={user.id}
                style={[styles.card, animatedStyle]}
                {...panResponder.panHandlers} // Attach PanResponder handlers
            >
                <Animated.Image source={{ uri: user.mainPicture }} style={styles.cardImage} />
                <BlurView intensity={80} style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}, {user.age}</Text>
                    <Text style={styles.userBio}>{user.bio}</Text>
                </BlurView>
            </Animated.View>
        );
    };

    // Initialize nextCardReady when component mounts or users change
    useEffect(() => {
        nextCardReady.current = true;
    }, [users]);

    return (
        <Surface style={styles.container}>
            {noMoreUsers ? renderEmptyState() : null}
            {users.map((user, index) => renderCard(user, index))} {/* Render all cards but control visibility */}
            {users[currentIndex] && (
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
            )}
        </Surface>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        position: 'relative',
        paddingTop: 20, // Add some padding at the top
    },
    card: {
        position: 'absolute',
        width: SCREEN_WIDTH - 40, // Slightly less width for more spacing
        height: SCREEN_WIDTH * 1.2, // Adjust card height
        marginHorizontal: 20, // Increased horizontal margin
        borderRadius: 25, // More rounded corners
        overflow: 'hidden',
        backgroundColor: COLORS.surface,
        elevation: 5, // Slightly increased elevation
        top: 20, // Move cards down a bit
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
        borderBottomLeftRadius: 25, // Match card BorderRadius
        borderBottomRightRadius: 25, // Match card BorderRadius
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Slightly darker overlay
    },
    userName: {
        fontSize: 26, // Slightly larger name
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 10, // Increased spacing
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 5,
    },
    userBio: {
        fontSize: 17, // Slightly larger bio text
        color: 'white',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 3,
        lineHeight: 24, // Improved line height for bio
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 40, // Move buttons further down
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
    },
    actionButton: {
        elevation: 5, // Increased button elevation
    },
    emptyState: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.background,
        zIndex: -1,
    },
    emptyStateTextContainer: { // Style for empty state text
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // Light background for text
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 15,
    },
    emptyStateHeadline: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    emptyStateBody: {
        fontSize: 18,
        color: COLORS.textSecondary,
        textAlign: 'center',
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
