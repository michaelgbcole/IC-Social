import { supabase } from '../lib/supabase';
import { decode } from 'base64-arraybuffer'

export const uploadImage = async (userId: string, base64Image: string) => {
  try {
    const bucketName = 'images';
    const base64Data = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1] 
      : base64Image;

    // Upload the image directly without folder creation
    const fileName = `${userId}/profile.jpg`;
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, decode(base64Data), {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};
