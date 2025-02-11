const API_URL = 'http://localhost:8081'; // Change this to your server URL in production

export interface UserData {
  name: string;
  email: string;
  picture: string;
}

export const saveUser = async (userData: UserData) => {
  try {
    console.log('Saving user:', userData);
    const response = await fetch(`${API_URL}/api/newUser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
};

export const getUserIds = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_URL}/api/getUserIds`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json(); // Now directly returns string[]
  } catch (error) {
    console.error('Error fetching user IDs:', error);
    throw error;
  }
};

