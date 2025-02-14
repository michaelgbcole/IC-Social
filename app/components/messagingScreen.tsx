import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, FlatList, TextInput } from 'react-native';
import { Surface, Text, List, Button, Avatar } from 'react-native-paper';
import { getMatches, sendMessage, getMessages } from '../../services/api';
import { useSocket } from '../contexts/SocketContext';
import { COLORS } from '../theme';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
}

interface Match {
  id: string;
  name: string;
  mainPicture: string;
  lastMessage?: Message;
}

export default function MessagingScreen({ userId }: { userId: string }) {
  const { socket, isConnected } = useSocket();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const pollingInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadMatches();
  }, []);

  useEffect(() => {
    if (selectedMatch) {
      // Initial load
      loadMessages(selectedMatch.id);

      // Set up polling every 10 seconds
      pollingInterval.current = setInterval(() => {
        loadMessages(selectedMatch.id);
      }, 10000);

      // Cleanup polling when chat is closed or component unmounts
      return () => {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
        }
      };
    }
  }, [selectedMatch]);

  useEffect(() => {
    if (socket && isConnected) {
      // Join user's room
      socket.emit('join', userId);

      // Listen for private messages
      socket.on('private message', (message) => {
        if (selectedMatch?.id === message.senderId || selectedMatch?.id === message.receiverId) {
          setMessages(prev => [message, ...prev]);
        }
        
        setMatches(prev => prev.map(match => {
          if (match.id === message.senderId || match.id === message.receiverId) {
            return { ...match, lastMessage: message };
          }
          return match;
        }));
      });

      return () => {
        socket.off('private message');
      };
    }
  }, [socket, isConnected, userId, selectedMatch]);

  const loadMatches = async () => {
    try {
      const matchData = await getMatches(userId);
      setMatches(matchData);
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  const loadMessages = async (matchId: string) => {
    try {
      const messageData = await getMessages(userId, matchId);
      setMessages(prev => {
        // Only update if there are new messages
        if (messageData.length === 0) return prev;
        if (prev.length === 0) return messageData;
        
        // Check if we have new messages by comparing the latest message IDs
        if (messageData[0].id !== prev[0].id) {
          return messageData;
        }
        return prev;
      });
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const fetchNewMessages = async (matchId: string) => {
    try {
      const messageData = await getMessages(userId, matchId);
      setMessages(messageData);
    } catch (error) {
      console.error('Error fetching new messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedMatch || !newMessage.trim() || !socket) return;

    try {
      // Save to database
      const savedMessage = await sendMessage(userId, selectedMatch.id, newMessage.trim());
      
      if (!savedMessage || savedMessage.error) {
        throw new Error(savedMessage?.error || 'Failed to save message');
      }

      // Clear input
      setNewMessage('');

      // Send through Socket.IO
      socket.emit('private message', {
        ...savedMessage,
        senderId: userId,
        receiverId: selectedMatch.id,
      });

      // Fetch messages after 2 seconds to ensure DB sync
      setTimeout(() => {
        fetchNewMessages(selectedMatch.id);
      }, 2000);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  return (
    <Surface style={styles.container}>
      {!selectedMatch ? (
        <View style={styles.matchesContainer}>
          <Text variant="headlineMedium" style={styles.title}>Your Matches</Text>
          <FlatList
            data={matches}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Surface style={styles.matchCard} elevation={2}>
                <List.Item
                  title={item.name}
                  description={item.lastMessage?.content ?? 'Start chatting!'}
                  left={() => (
                    <View style={styles.avatarContainer}>
                      <Avatar.Image size={60} source={{ uri: item.mainPicture }} />
                      {!item.lastMessage && (
                        <View style={styles.newMatchBadge}>
                          <Text style={styles.newMatchText}>New</Text>
                        </View>
                      )}
                    </View>
                  )}
                  onPress={() => setSelectedMatch(item)}
                  titleStyle={styles.matchName}
                  descriptionStyle={styles.lastMessage}
                  style={styles.listItem}
                />
              </Surface>
            )}
            contentContainerStyle={styles.matchesList}
          />
        </View>
      ) : (
        <View style={styles.chatContainer}>
          <Surface style={styles.header} elevation={2}>
            <Button 
              icon="arrow-left" 
              onPress={() => setSelectedMatch(null)}
              textColor={COLORS.primary}
            >
              Back
            </Button>
            <View style={styles.headerInfo}>
              <Avatar.Image size={40} source={{ uri: selectedMatch.mainPicture }} />
              <Text variant="titleMedium" style={styles.headerName}>{selectedMatch.name}</Text>
            </View>
          </Surface>

          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[
                styles.messageBubble,
                item.senderId === userId ? styles.sentMessage : styles.receivedMessage
              ]}>
                <Text style={item.senderId === userId ? styles.sentText : styles.receivedText}>
                  {item.content}
                </Text>
              </View>
            )}
            inverted
            contentContainerStyle={styles.messagesList}
          />

          <Surface style={styles.inputContainer} elevation={4}>
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              multiline
              maxLength={500}
            />
            <Button 
              mode="contained" 
              onPress={handleSendMessage}
              style={styles.sendButton}
              disabled={!newMessage.trim()}
            >
              Send
            </Button>
          </Surface>
        </View>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  matchesList: {
    padding: 16,
  },
  listItem: {
    padding: 0,
  },
  container: {
    flex: 1,
    width: '100%',
  },
  title: {
    padding: 20,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    marginVertical: 4,
  },
  sentMessage: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  receivedMessage: {
    backgroundColor: '#E8E8E8',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginRight: 12,
    padding: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
  },
  matchesContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  matchCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  avatarContainer: {
    position: 'relative',
  },
  newMatchBadge: {
    position: 'absolute',
    right: -5,
    top: -5,
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 4,
  },
  newMatchText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  matchName: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
  lastMessage: {
    color: COLORS.grey,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  headerName: {
    marginLeft: 12,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  messagesList: {
    padding: 16,
  },
  sentText: {
    color: 'white',
  },
  receivedText: {
    color: COLORS.text,
  },
});
