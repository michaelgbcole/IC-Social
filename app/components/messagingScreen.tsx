import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, FlatList, TextInput } from 'react-native';
import { Surface, Text, List, Button, Avatar } from 'react-native-paper';
import { getMatches, sendMessage, getMessages } from '../../services/api';
import { useSocket } from '../contexts/SocketContext';

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

  useEffect(() => {
    loadMatches();
  }, []);

  useEffect(() => {
    if (selectedMatch) {
      loadMessages(selectedMatch.id);
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
      setMessages(messageData);
    } catch (error) {
      console.error('Error loading messages:', error);
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
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  if (!selectedMatch) {
    return (
      <Surface style={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>Matches</Text>
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <List.Item
              title={item.name}
              description={item.lastMessage?.content ?? 'Start chatting!'}
              left={() => <Avatar.Image size={50} source={{ uri: item.mainPicture }} />}
              onPress={() => setSelectedMatch(item)}
            />
          )}
        />
      </Surface>
    );
  }

  return (
    <Surface style={styles.container}>
      <View style={styles.header}>
        <Button icon="arrow-left" onPress={() => setSelectedMatch(null)}>
          Back
        </Button>
        <Text variant="titleLarge">{selectedMatch.name}</Text>
      </View>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[
            styles.messageBubble,
            item.senderId === userId ? styles.sentMessage : styles.receivedMessage
          ]}>
            <Text>{item.content}</Text>
          </View>
        )}
        inverted
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
        />
        <Button onPress={handleSendMessage} mode="contained">
          Send
        </Button>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  title: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  messageBubble: {
    margin: 8,
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  sentMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  receivedMessage: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  input: {
    flex: 1,
    marginRight: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
  },
});
