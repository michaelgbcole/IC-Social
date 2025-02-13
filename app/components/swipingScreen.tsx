import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { IconButton, Text, Surface } from 'react-native-paper';
import { getPotentialMatches, handleSwipe as handleSwipeApi } from '../../services/api';

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

interface SwipingScreenProps {
    userId: string;
}

export default function SwipingScreen({ userId }: SwipingScreenProps) {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [noMoreUsers, setNoMoreUsers] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMatch, setHasMatch] = useState(false);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const fetchedUsers = await getPotentialMatches(userId);
            if (!fetchedUsers || fetchedUsers.length === 0) {
                setNoMoreUsers(true);
                setUsers([]);
            } else {
                setUsers(fetchedUsers);
                setCurrentIndex(0);
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
        loadUsers();
    }, [userId]);

    useEffect(() => {
        // Check for mutual likes in current user
        const currentUser = users[currentIndex];
        if (currentUser?.mutualLike) {
            alert(`You matched with ${currentUser.name}!`);
        }
    }, [currentIndex, users]);

    const handleSwipe = async (liked: boolean) => {
        const currentProfile = users[currentIndex];
        console.log(`Swiped ${liked ? 'right' : 'left'} on user ${currentProfile.id}`);
        
        if (liked) {
            const result = await handleSwipeApi(userId, currentProfile.id, true);
            if (result.isMatch || (currentProfile.hasLikedMe && liked)) {
                alert(`You matched with ${currentProfile.name}!`);
                setHasMatch(true);
            }
        }

        if (currentIndex < users.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setNoMoreUsers(true);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.emptyStateContainer]}>
                <Text style={styles.emptyStateText}>Loading...</Text>
            </View>
        );
    }

    if (noMoreUsers || users.length === 0) {
        return (
            <View style={[styles.container, styles.emptyStateContainer]}>
                <Text style={styles.emptyStateText}>Nobody left! Come back later</Text>
            </View>
        );
    }

    const currentUser = users[currentIndex];

    return (
        <Surface style={styles.container}>
            {hasMatch && (
                <View style={styles.matchIndicator}>
                    <Text style={styles.matchText}>New Match!</Text>
                </View>
            )}
            <View style={styles.imageContainer}>
                <Image 
                    source={{ uri: currentUser.mainPicture }} 
                    style={styles.image} 
                />
                <View style={styles.userInfo}>
                    <Text variant="headlineSmall">{currentUser.name}, {currentUser.age}</Text>
                    <Text variant="bodyMedium">{currentUser.bio}</Text>
                </View>
            </View>
            
            <View style={styles.buttonContainer}>
                <IconButton
                    icon="close"
                    mode="contained"
                    containerColor="red"
                    iconColor="white"
                    size={30}
                    onPress={() => handleSwipe(false)}
                />
                <IconButton
                    icon="check"
                    mode="contained"
                    containerColor="green"
                    iconColor="white"
                    size={30}
                    onPress={() => handleSwipe(true)}
                />
            </View>
        </Surface>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        width: '100%',
    },
    imageContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width: '100%',
        height: '80%',
        borderRadius: 20,
    },
    userInfo: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
    },
    emptyStateContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: 20,
        textAlign: 'center',
        color: '#666',
    },
    matchIndicator: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'red',
        borderRadius: 50,
        padding: 10,
        zIndex: 1,
    },
    matchText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
