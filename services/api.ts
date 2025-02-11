const API_URL = 'http://localhost:8081'; // Change this to your server URL in production

export interface UserData {
  name: string;
  email: string;
  picture: string;
}

type OnboardingData = {
  id: string;
  name: string;
  email: string;
  picture: string;
  bio: string;
  interests: string;
  mainPicture: string;
  age: number;
}

export const authenticateUser = async (userData: UserData) => {
  try {
    const response = await fetch(`${API_URL}/api/auth`, {
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
    console.error('Error authenticating user:', error);
    throw error;
  }
};

// Remove or comment out the old saveUser function as it's replaced by authenticateUser
// export const saveUser = async (userData: UserData) => {
//   try {
//     console.log('Saving user:', userData);
//     const response = await fetch(`${API_URL}/api/newUser`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(userData),
//     });

//     if (!response.ok) {
//       throw new Error('Network response was not ok');
//     }

//     return await response.json();
//   } catch (error) {
//     console.error('Error saving user:', error);
//     throw error;
//   }
// };

export const getUserId = async (email: string) => {
  console.log('Getting user ID:', email);
  try {
    const response = await fetch(`${API_URL}/api/getUserId`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting user id:', error);
    throw error;
  }
}

export const updateUser = async (userId: string, onboardingData: OnboardingData) => {
  try {
    console.log('Updating user:', onboardingData);
    const response = await fetch(`${API_URL}/api/updateUser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(onboardingData),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating user:', error);
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

