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
  gender: string;
}

export interface UserProfile {
  id: string;
  name: string;
  mainPicture: string;
  age: number;
  bio: string;
  gender: string;
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
//     throw error;f
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

export const getTenUserImages = async (userId: string) => {
  try {
    const response = await fetch(`${API_URL}/api/getTenUserImages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user images:', error);
    throw error;
  }
};

export const getPotentialMatches = async (userId: string) => {
  try {
    const response = await fetch(`${API_URL}/api/getPotentialMatches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching potential matches:', error);
    throw error;
  }
};

export const checkProfileComplete = async (userId: string) => {
  try {
    const response = await fetch(`${API_URL}/api/checkProfile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking profile:', error);
    throw error;
  }
};

export const handleSwipe = async (userId: string, targetUserId: string, liked: boolean) => {
  try {
    const response = await fetch(`${API_URL}/api/handleSwipe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, targetUserId, liked }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error handling swipe:', error);
    throw error;
  }
};

export const getMatches = async (userId: string) => {
  try {
    const response = await fetch(`${API_URL}/api/getMatches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching matches:', error);
    throw error;
  }
};

export const getMessages = async (userId: string, matchId: string) => {
  try {
    const response = await fetch(`${API_URL}/api/getMessages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, matchId }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

export const sendMessage = async (senderId: string, receiverId: string, content: string) => {
  try {
    console.log('Sending message:', { senderId, receiverId, content }); // Debug log
    const response = await fetch(`${API_URL}/api/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ senderId, receiverId, content }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send message');
    }

    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

