import React, { useState } from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';
import { Button, TextInput, SegmentedButtons, Text, Surface } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../../services/storage';
import { COLORS } from '../theme';

interface OnboardingScreenProps {
  name: string;
  userId: string;
  onComplete: (profileData: {
    image: string;
    bio: string;
    preference: string;
    age: number;
    gender: string;
  }) => void;
}

export default function OnboardingScreen({ name, userId, onComplete }: OnboardingScreenProps) {
  const [image, setImage] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('')
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
      gender,
    });
  };

  return (
    <Surface style={styles.container}>
      <Text variant="headlineMedium" style={styles.welcome}>
        Welcome to IC Social, {name}!
      </Text>
      
      <View style={styles.imageContainer}>
        {image ? (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: image }} style={styles.image} />
            <Button 
              mode="contained" 
              onPress={pickImage}
              style={styles.changePhotoButton}
              labelStyle={styles.buttonLabel}
            >
              Change Photo
            </Button>
          </View>
        ) : (
          <Button 
            mode="contained" 
            onPress={pickImage}
            style={styles.uploadButton}
            icon="camera"
            labelStyle={styles.buttonLabel}
          >
            Upload Profile Picture
          </Button>
        )}
      </View>

      <TextInput
        mode="outlined"
        label="Age"
        value={age}
        onChangeText={(text) => {
          if (/^\d*$/.test(text)) setAge(text);
        }}
        keyboardType="numeric"
        style={[styles.input, styles.ageInput]}
        maxLength={2}
        outlineColor={COLORS.primary}
        activeOutlineColor={COLORS.primary}
      />

      <TextInput
        mode="outlined"
        label="Bio"
        value={bio}
        onChangeText={setBio}
        multiline
        maxLength={140}
        style={[styles.input, styles.bioInput]}
        right={<TextInput.Affix text={`${bio.length}/140`} />}
        outlineColor={COLORS.primary}
        activeOutlineColor={COLORS.primary}
      />

      <Text variant="titleMedium" style={styles.sectionTitle}>
        I am a:
      </Text>
      
      <SegmentedButtons
        value={gender}
        onValueChange={setGender}
        buttons={[
          { 
            value: 'female', 
            label: 'Woman',
            style: styles.segmentButton,
            checkedColor: COLORS.primary,
          },
          { 
            value: 'male', 
            label: 'Man',
            style: styles.segmentButton,
            checkedColor: COLORS.primary,
          },
        ]}
        style={styles.segmentedButtons}
      />

      <Text variant="titleMedium" style={styles.sectionTitle}>
        I'm interested in:
      </Text>
      
      <SegmentedButtons
        value={preference}
        onValueChange={setPreference}
        buttons={[
          { 
            value: 'women', 
            label: 'Women',
            style: styles.segmentButton,
            checkedColor: COLORS.primary,
          },
          { 
            value: 'men', 
            label: 'Men',
            style: styles.segmentButton,
            checkedColor: COLORS.primary,
          },
          { 
            value: 'both', 
            label: 'Both',
            style: styles.segmentButton,
            checkedColor: COLORS.primary,
          },
        ]}
        style={styles.segmentedButtons}
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.submitButton}
        disabled={!image || !bio || !preference || !age || !gender}
        labelStyle={styles.buttonLabel}
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
    backgroundColor: COLORS.background,
  },
  welcome: {
    textAlign: 'center',
    marginBottom: 30,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imageWrapper: {
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 10,
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
  changePhotoButton: {
    backgroundColor: COLORS.secondary,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: COLORS.background,
    marginBottom: 20,
  },
  ageInput: {
    maxWidth: 100,
  },
  bioInput: {
    minHeight: 100,
  },
  sectionTitle: {
    marginBottom: 10,
    color: COLORS.primary,
    fontWeight: '500',
  },
  segmentedButtons: {
    marginBottom: 20,
  },
  segmentButton: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
  },
});