import React, { useState } from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';
import { Button, TextInput, SegmentedButtons, Text, Surface } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../../services/storage';

interface OnboardingScreenProps {
  name: string;
  userId: string;
  onComplete: (profileData: {
    image: string;
    bio: string;
    preference: string;
    age: number;
  }) => void;
}

export default function OnboardingScreen({ name, userId, onComplete }: OnboardingScreenProps) {
  const [image, setImage] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [preference, setPreference] = useState('');
  const [age, setAge] = useState<string>('');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      try {
        const publicUrl = await uploadImage(userId, result.assets[0].base64!);
        setImage(publicUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image');
      }
    }
  };

  const handleSubmit = () => {
    const ageNumber = parseInt(age, 10);
    
    if (!image || !bio || !preference || !age || isNaN(ageNumber)) {
      alert('Please fill in all fields');
      return;
    }
    
    
    onComplete({
      image,
      bio,
      preference,
      age: ageNumber,
    });
  };

  return (
    <Surface style={styles.container}>
      <Text variant="headlineMedium" style={styles.welcome}>
        Welcome, {name}!
      </Text>
      
      <View style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <Button mode="contained" onPress={pickImage}>
            Upload Profile Picture
          </Button>
        )}
      </View>

      <TextInput
        mode="outlined"
        label="Age"
        value={age}
        onChangeText={(text) => {
          // Only allow numbers
          if (/^\d*$/.test(text)) setAge(text);
        }}
        keyboardType="numeric"
        style={styles.ageInput}
        maxLength={2}
      />

      <TextInput
        mode="outlined"
        label="Bio"
        value={bio}
        onChangeText={setBio}
        multiline
        maxLength={140}
        style={styles.bioInput}
        right={<TextInput.Affix text={`${bio.length}/140`} />}
      />

      <Text variant="bodyLarge" style={styles.preferenceLabel}>
        I'm interested in:
      </Text>
      
      <SegmentedButtons
        value={preference}
        onValueChange={setPreference}
        buttons={[
          { value: 'women', label: 'Women' },
          { value: 'men', label: 'Men' },
          { value: 'both', label: 'Both' },
        ]}
        style={styles.segmentedButtons}
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.submitButton}
        disabled={!image || !bio || !preference || !age}
      >
        Complete Profile
      </Button>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    width: '100%',
  },
  welcome: {
    textAlign: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  bioInput: {
    marginBottom: 20,
  },
  preferenceLabel: {
    marginBottom: 10,
  },
  segmentedButtons: {
    marginBottom: 20,
  },
  submitButton: {
    marginTop: 20,
  },
  ageInput: {
    marginBottom: 20,
  },
});