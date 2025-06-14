// API base URL
// const API_BASE_URL = "https://chat.aa-bot.com/api"
const API_BASE_URL = "http://localhost/api";

// Helper function for making API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  // Default options with authentication
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `${localStorage.getItem("token")}`,
    },
  };

  const fetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, fetchOptions);

    // Handle unauthorized access
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login"; // Redirect to login page
      return null;
    }

    // Handle other error responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    // Parse JSON response
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
}

// API functions for authentication
const AuthAPI = {
  // Login user
  login: async (username, password) => {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password, nonstress: nonstress.getToken() }),
    });

    if (response && response.token) {
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", response.me);
    }

    return response;
  },

  // Register new user
  register: async (username, email, password) => {
    const response = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password, nonstress: nonstress.getToken() }),
    });

    return response;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  },

  // Get current user info
  getCurrentUser: () => {
    return apiRequest("/users/me");
  },
};

// API functions for users
const UsersAPI = {
  // Get all users
  getUsers: () => {
    return apiRequest("/users");
  },

  // Get user by ID
  getUser: (userId) => {
    return apiRequest(`/users/${userId}`);
  },

  // Update user status
  updateStatus: (status) => {
    return apiRequest("/users/status", {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  // Update user roles
  updateUserRoles: (userId, roles) => {
    return apiRequest(`/users/${userId}/roles`, {
      method: "PATCH",
      body: JSON.stringify({ roles }),
    });
  },
};

// API functions for channels
const ChannelsAPI = {
  // Get all channels
  getChannels: () => {
    return apiRequest("/channels");
  },

  // Get channel by ID
  getChannel: (channelId) => {
    return apiRequest(`/channels/${channelId}`);
  },

  // Create new channel
  createChannel: (channelData) => {
    return apiRequest("/channels", {
      method: "POST",
      body: JSON.stringify(channelData),
    });
  },

  // Update channel
  updateChannel: (channelId, channelData) => {
    return apiRequest(`/channels/${channelId}`, {
      method: "PUT",
      body: JSON.stringify(channelData),
    });
  },

  // Delete channel
  deleteChannel: (channelId) => {
    return apiRequest(`/channels/${channelId}`, {
      method: "DELETE",
    });
  },

  // Update channel permissions
  updateChannelPermissions: (channelId, permissions) => {
    return apiRequest(`/channels/${channelId}/permissions`, {
      method: "PUT",
      body: JSON.stringify({ permissions }),
    });
  },
};

// API functions for messages
const MessagesAPI = {
  // Get messages for a channel
  getMessages: (channelId) => {
    return apiRequest(`/channels/${channelId}/messages`);
  },

  // Send a message
  sendMessage: (channelId, content) => {
    return apiRequest(`/channels/${channelId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  // Update a message
  updateMessage: (channelId, messageId, content) => {
    return apiRequest(`/channels/${channelId}/messages/${messageId}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    });
  },

  // Delete a message
  deleteMessage: (channelId, messageId) => {
    return apiRequest(`/channels/${channelId}/messages/${messageId}`, {
      method: "DELETE",
    });
  },
};

// API functions for roles
const RolesAPI = {
  // Get all roles
  getRoles: () => {
    return apiRequest("/roles");
  },

  // Get role by ID
  getRole: (roleId) => {
    return apiRequest(`/roles/${roleId}`);
  },

  // Create new role
  createRole: (roleData) => {
    return apiRequest("/roles", {
      method: "POST",
      body: JSON.stringify(roleData),
    });
  },

  // Update role
  updateRole: (roleId, roleData) => {
    return apiRequest(`/roles/${roleId}`, {
      method: "PUT",
      body: JSON.stringify(roleData),
    });
  },

  // Delete role
  deleteRole: (roleId) => {
    return apiRequest(`/roles/${roleId}`, {
      method: "DELETE",
    });
  },

  // Update role position (for drag and drop reordering)
  updateRolePositions: (rolePositions) => {
    return apiRequest("/roles/positions", {
      method: "PATCH",
      body: JSON.stringify({ positions: rolePositions }),
    });
  },
};

// API functions for server settings
const ServerAPI = {
  // Get server info
  getServerInfo: () => {
    return apiRequest("/server");
  },

  // Update server info
  updateServerInfo: (serverData) => {
    return apiRequest("/server", {
      method: "PUT",
      body: JSON.stringify(serverData),
    });
  },
};

// Export all API services
const API = {
  Auth: AuthAPI,
  Users: UsersAPI,
  Channels: ChannelsAPI,
  Messages: MessagesAPI,
  Roles: RolesAPI,
  Server: ServerAPI,
};
